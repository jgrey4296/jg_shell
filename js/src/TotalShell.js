//an idea for a complete shell
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['../libs/ReteDataStructures','underscore','./DataStructures','./utils'],function(RDS,_,DS,util){
    if(RDS === undefined) throw new Error("RDS Not Loaded");
    if(DS === undefined) throw new Error("DS not loaded");
    if(_ === undefined) throw new Error("Underscore not loaded");
    
    var CompleteShell = function(){
        console.log("Shell constructor");
        this.tags = {};
        this.tags.type = 'Shell';
        //the root
        this.root = new DS.GraphNode('__root');
        
        //disconnected nodes:
        this.disconnected = {
            noParents : new DS.GraphNode('disconnectedFromParents'),
            noChildren : new DS.GraphNode('disconnectedFromChildren'),
        };

        //All Nodes:
        this.allNodes = {};
        this.allNodes[this.root.id] = this.root;
        this.allNodes[this.disconnected.noParents.id] = this.disconnected.noParents;
        this.allNodes[this.disconnected.noChildren.id] = this.disconnected.noChildren;
        //AllRules:
        this.allRules = [];
        this.allRulesByName = {};
        //current node/rule
        this.cwd = this.root;

        //stashed locations:
        this._nodeStash = [];
        this.previousLocation = 0;
        
    };

    //END OF DATA STRUCTURES
    //----------------------------------------

    /*Methods:
      
      @params target child,parent, or node specific
      @params type the type of node to add
      @params name the name of the node to add
    */
    CompleteShell.prototype.addNode = function(target,type,name){
        console.log("Adding:",target,type,name);
        //create the new node of type
        if(type === 'Rule') throw new Error('Rule Construction has its own function');
        //Retrieve the node constructor from the data structures module:
        //----------
        var constructor = DS[type.toLowerCase()];
        //----------
        
        if(this.cwd[target] === undefined) throw new Error("Unrecognised target: " + target);

        if(constructor === undefined){
            console.log("Available Types:",_.keys(DS));
            throw new Error("Unrecognised Node Type: " +type.toLowerCase());
        }
                
        if(this.cwd[target][name] !== undefined){
            throw new Error("Node already exists, id of: " + this.cwd[target][name].id);
        }

        //call the ctor, adding to the target
        if(constructor && this.cwd[target]){
            var newNode;
            if(target === "parents"){
                newNode = new constructor(name,undefined,this);
                newNode.children[this.cwd.id] = true;//this.cwd;
            }else{
                newNode = new constructor(name,this.cwd,this);
            }
            this.allNodes[newNode.id] = newNode;
            this.cwd[target][newNode.id] = true;//newNode;

            
            //if the cwd has disconnected from parents
            //or disconnectedFrom children
            //remove from as appropriate
            if(this.cwd[target][this.disconnected.noParents.id]){
                this.rm(this.disconnected.noParents.id);
            }
            if(this.cwd[target][this.disconnected.noChildren.id]){
                this.rm(this.disconnected.noChildren.id);                
            }

            
            // if(this.allNodes[newNode.id]){
            //     throw new Error("Node Id is already used");
            // }
            
            //add all the children of the node as well,
            //using a recursive map, so *all* children are added
            // var shellInstance = this;
            // var addChildrenFn = function(d){
            //     if(shellInstance.allNodes[d.id]){
            //         return;
            //     }
            //     shellInstance.allNodes[d.id] = d;//d;
            //     _.values(d.children).map(addChildrenFn);
            //     _.values(d.parents).map(addChildrenFn);
            // };
            //addChildrenFn(newNode);
            return newNode;
        }
        throw new Error("Add Node general error");
    };
    
    /**
       @params target The id (global) or name (local) to move to
    */
    CompleteShell.prototype.cd = function(target){
        this.previousLocation = this.cwd.id;
        //TODO: cd into a rule
        //If a number:
        if(target === ".."){
            console.log("cd : ..");
            if(this.cwd._originalParent){
                this.cd(this.cwd._originalParent);
            }else{
                var randomParentKey = util.randomChoice(Object.keys(this.cwd.parents));
                if(randomParentKey !== undefined){
                    this.cd(randomParentKey);
                }
            }
            return;
        }
        
        //id specified
        if(!isNaN(Number(target)) && this.allNodes[Number(target)]){
            console.log("cd : ", Number(target));
            this.cwd = this.allNodes[Number(target)];
            return;
        }
        
        //passed a name. convert it to an id
        console.log("Cd-ing: ",target);
        var nameIdPairs = {};
        var children = this.cwd.children;

        _.keys(children).map(function(d){
            return this.allNodes[d];
        },this).forEach(function(d){
            this[d.name] = d.id;
        },nameIdPairs);//pay attention to the state arg
        
        var parents = this.cwd.parents;
        _.keys(parents).map(function(d){
            return this.allNodes[d];
        },this).forEach(function(d){
            this[d.name] = d.id;
        },nameIdPairs);//state arg

        console.log("Available keys:",_.keys(nameIdPairs));
        //if you can find the target to move to:
        if(nameIdPairs[target]){
            this.cd(nameIdPairs[target]);
        }else{
            //cant find the target, complain
            throw new Error("Unrecognised cd form");
        }
    };
    
    CompleteShell.prototype.getNodeListByIds = function(idList){
        var retList = idList.map(function(d){
            if(this.allNodes[d]){
                retList.push(this.allNodes[d]);
            }            
        },this);
        return retList;
    };
    
    CompleteShell.prototype.setParameter = function(field,parameter,value){
        if(!this.cwd[field]) throw new Error("Unrecognised field");
        if(field !== 'values' && field !== 'tags' && field !== 'annotations'){
            throw new Error("Bad field");
        }
        if(value !== undefined){
            this.cwd[field][parameter] = value;
        }else{
            //if no value is specified, remove the entry
            delete this.cwd[field][parameter];
        }
    };
    
    
    //TODO: should this be mutual?
    CompleteShell.prototype.link = function(target,id,reciprocal){
        if(isNaN(Number(id))) throw new Error("id should be a global id number");
        if(this.allNodes[id] === undefined){
            throw new Error("Node for id " + id + " does not exist");
        }
        if(!this.cwd[target]) throw new Error("Unrecognised target");
        var nodeToLink = this.allNodes[id];
        this.cwd[target][nodeToLink.id] = true; //this.allNodes[id];
        if(reciprocal){
            var rtarget = 'parents';
            if(target === 'parents') rtarget = 'children';
            nodeToLink[rtarget][this.cwd.id] = true; //this.cwd;
        }
    };
    
    //Remove a node from the parent/child lists
    CompleteShell.prototype.rm = function(id){
        //is an id
        if(!isNaN(Number(id))){
            id = Number(id);
            console.log("Removing:",id);
            var removed;
            if(this.cwd.parents[id]){
                //if removing a parent
                //ASSUMING NODES ARE STORED BY ID NOT NAME
                removed = this.allNodes[id];
                delete this.cwd.parents[id];
                delete removed.children[this.cwd.id];
            }else if(this.cwd.children[id]){
                //if removing a child
                removed = this.allNodes[id];
                console.log("getting:",removed);
                delete this.cwd.children[id];
                delete removed.parents[this.cwd.id];
            }else{
                throw new Error("Unrecognised id: " + id);
            }
            //if the removed node has no other parents,
            //connect it to the parentless list
            console.log("cleaning up from id delete" );
            if(_.values(removed.parents).filter(function(d){return d;}).length === 0){
                console.log("Storing in no parents:",this.allNodes[1],removed);
                this.disconnected.noParents.children[removed.id] = true;
                removed.parents[this.disconnected.noParents.id] = true;//this.disconnected.noParents;
            }
            if(_.values(removed.children).filter(function(d){return d;}).length === 0){
                console.log("Storing in no children:",this.allNodes[2],removed);
                this.disconnected.noChildren.parents[removed.id] = true;//removed;
                removed.children[this.disconnected.noChildren.id] = true;//this.disconnected.noChildren;
            }
            //FINISHED REMOVING NUMERIC ID NODE
        }else{
            //is a NAME
            //loop over all children and parents looking for name
            //and delete it
            var name = id;
            var childRemoved = _.keys(this.cwd.children).map(function(d){ if(this.allNodes[d].name === name){ return this.allNodes[d];}},this);
            childRemoved.forEach(function(d){
                delete d.parents[shell.cwd.id];
                delete this.cwd.children[d.id];
                console.log("deleted:",shell.cwd.children,d);
            },this);

            var parentRemoved = _.keys(this.cwd.parents).map(function(d){ if(this.allNodes[d].name === name){ return this.allNodes[d];}},this);
            parentRemoved.forEach(function(d){
                delete this.cwd.parents[d.id];
                delete d.children[shell.cwd.id];
            },this);
            
            console.log(childRemoved,parentRemoved);
            if(childRemoved.length === 0 && parentRemoved.length === 0){
                throw new Error("No node found with id: " + id);
            }

            //cleanup and connect any nodes to noParents/Children if neccesary:
            console.log("cleaning up from name delete");
            parentRemoved.concat(childRemoved).forEach(function(d){
                console.log(_.values(d.parents).filter(function(d){return d;}));
                if(_.values(d.parents).filter(function(d){return d;}).length === 0){
                    console.log("disconnected");
                    this.disconnected.noParents.children[d.id] = true;//d;
                    d.parents[this.disconnected.noParents.id] = true;//this.disconnected.noParents;
                }
                if(_.values(d.children).filter(function(d){return d;}).length === 0){
                    console.log("disconnected2");
                    this.disconnected.noChildren.parents[d.id] = true; //d;
                    d.children[this.disconnected.noChildren.id] = true;//this.disconnected.noChildren;
                }
            },this);//this as arg, so this= shell still

            
            //FINISHED REMOVING A NUMERIC SPECIFIED NODE
        }
    };
    
    CompleteShell.prototype.rename = function(name){
        this.cwd.name = name;
    };
    
    //------------------------------
    //Rule modifiers:
    CompleteShell.prototype.addCondition = function(){
        if(this.cwd.tags.type !== 'RuleNode'){
            throw new Error("Trying to modify a rule when not located at a rule");
        }
        var cond = new RDS.Condition();
        this.cwd.rule.conditions.push(cond);
    };

    CompleteShell.prototype.addTest = function(conditionNumber,testField,op,value){
        console.log("Adding test:",conditionNumber,testField,op,value,this.cwd.rule.conditions);
        if(this.cwd.tags.type !== 'RuleNode'){
            throw new Error("Trying to modify a rule when not located at a rule");
        }

        if(this.cwd.rule.conditions[conditionNumber] === undefined){
            console.log(conditionNumber,this.cwd.rule.conditions);
            throw new Error("Can't add a test to a non-existent condition");
        }
        var test = new RDS.ConstantTest(testField,op,value);
        this.cwd.rule.conditions[conditionNumber].constantTests.push(test);
    };

    //ie: toVar  <- wme.fromVar
    //a <- wme.first
    CompleteShell.prototype.addBinding = function(conditionNum,toVar,fromVar){
        console.log("Add binding to:",conditionNum,toVar,fromVar);
        if(this.cwd.tags.type !== 'RuleNode'){
            throw new Error("Trying to modify a rule when not located at a rule");
        }
        if(this.cwd.rule.conditions[conditionNum] === undefined){
            throw new Error("Can't add binding to non=existent condition");
        }
        this.cwd.rule.conditions[conditionNum].addBinding(toVar,fromVar);
        
    };

    
    CompleteShell.prototype.addAction = function(valueArray){
        if(this.cwd.tags.type !== 'RuleNode'){
            throw new Error("Trying to modify a rule when not located at a rule");
        }
        var actionDescription = new RDS.ActionDescription(valueArray[0], valueArray[1]);
        this.cwd.rule.actions.push(actionDescription);
    };
    
    

    //Stashing and unstashing:
    CompleteShell.prototype.stash = function(){
        this._nodeStash.push(this.cwd.id);
    };

    CompleteShell.prototype.unstash = function(){
        if(this._nodeStash.length > 0){
            this.cd(this._nodeStash.pop());
        }
    };

    CompleteShell.prototype.top = function(){
        if(this._nodeStash.length > 0){
            this.cd(this._nodeStash[this._nodeStash.length - 1]);
        }
    };
    
    //conversion to simple arrays for visualisation
    //export/import json


    CompleteShell.prototype.exportToJson = function(){
        var cyclesRemovedObjects = _.map(this.allNodes,function(d){
            //for each object, convert references to other objects into id numbers
            
        });

        
    };
    
    //Interface of potential objects, used in addNode lookup,
    //which defaults to lowercase
    var interface =  {
        "CompleteShell":CompleteShell,
        "shell"     : CompleteShell,
    };
    return interface;
});
