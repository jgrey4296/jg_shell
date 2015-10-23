//an idea for a complete shell
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['../libs/ReteDataStructures','underscore'],function(RDS,_){
    if(RDS === undefined) throw new Error("RDS Not Loaded");
    if(_ === undefined) throw new Error("Underscore not loaded");


    var randomChoice = function(array){
        var randIndex = Math.floor(Math.random() * array.length);
        return array[randIndex];
    };
    
    
    var nextId = 0;
    //Data Structures:
    //The main node of the graph
    var GraphNode = function(name,parent){
        //Id and name for identification
        this.id = nextId++;
        this.name = name;
        //parents and children for links
        //storing by ID
        this.parents = {};
        this._originalParent = parent;
        if(parent){
            this.parents[parent.id] = parent;
        }
        this.children = {};
        //values and tags and annotations for data
        this.values = {};
        this.tags = {};
        this.annotations = {};
        this.tags['type'] = 'GraphNode';
    };


    GraphNode.prototype.getLists = function(fieldNameList){
        var theNode = this;
        var allArrays = fieldNameList.map(function(d){
            if(theNode[d] !== undefined){
                if(d !== "id" && d !== "name"){
                    return ["","| " + d + " |"].concat(theNode.getList(d));
                }else{
                    return d +  ": " + theNode[d];
                }
            }else{
                console.log("Could not find: ",d,theNode);
            }
        });
        //console.log("Prior to flattening:",allArrays);
        return _.flatten(allArrays);
    };
    
    GraphNode.prototype.getList = function(fieldName){
        //console.log("Getting list for:",fieldName,this[fieldName]);
        var obj = this;
        if(this[fieldName] === undefined) throw new Error("Unrecognised field");
        var retArray = [];
        Object.keys(obj[fieldName]).map(function(d){
                retArray.push(d + ": " + obj[fieldName][d]);
        });
        //console.log("Final list for:",fieldName,retArray);
        return retArray;
    };
    
    //----------
    var Role = function(name,parent,description){
        GraphNode.call(this,name,parent);
        this.tags['type'] = 'Role';
        this.description = description;
        var temp = new RuleContainer('Rules',this);
        this.children[temp.id] = temp;
        
    };
    Role.prototype = Object.create(GraphNode.prototype);
    
    var Institution = function(name,parent){
        GraphNode.call(this,name,parent);
        this.tags['type'] = 'Institution';
        //All of these are nodes themselves?
        var temp = new GraphNode('Roles',this);
        this.children[temp.id] = temp;
        temp = new GraphNode('Activities',this);
        this.children[temp.id] = temp;
        temp = new GraphNode('Governance',this);
        this.children[temp.id] = temp;
        temp = new GraphNode('OutwardRelations',this);
        this.children[temp.id] = temp;
        temp = new GraphNode('Facts',this);
        this.children[temp.id] = temp;
        temp = new GraphNode('Norms',this);
        this.children[temp.id] = temp;
        temp = new GraphNode('InwardRelations');
        this.parents[temp.id] = temp;
        temp.children[this.id] = this;

        //All rules defined in this institution?
        this.allRules = {};
    };
    Institution.prototype = Object.create(GraphNode.prototype);
    
    var Activity = function(name,parent){
        GraphNode.call(this,name,parent);
        this.tags['type'] = 'Activity';
        //actor type
        this.values['actor'] = null;
        this.values['object'] = null;
        this.values['tool'] = null;
        //rules for this activity
        var temp = new GraphNode('Rules',this);
        this.children[temp.id] = temp;
        //potential interactions
        temp = new GraphNode('Community',this);
        this.children[temp.id] = temp;
        //how the community interacts with the outcome/object
        temp = new GraphNode('DivisionOfLabour',this);
        this.children[temp.id] = temp;
    };
    Activity.prototype = Object.create(GraphNode.prototype);


    var RuleContainer = function(name,parent){
        GraphNode.call(this,name,parent);
        this.tags['type'] = 'RuleContainer';
        this.rules = [];
        this.rulesByName = {};

    };
    RuleContainer.prototype = Object.create(GraphNode.prototype);

    
    var CompleteShell = function(){
        this.tags = {};
        this.tags['type'] = 'Shell';
        //the root
        this.root = new GraphNode('__root');
        
        //disconnected nodes:
        this.disconnected = {
            noParents : new GraphNode('disconnectedFromParents'),
            noChildren : new GraphNode('disconnectedFromChildren'),
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
        var constructor = interface[type.toLowerCase()];

        if(this.cwd[target] === undefined) throw new Error("Unrecognised target: " + target);

        if(constructor === undefined) throw new Error("Unrecognised Node Type: " +type.toLowerCase());
                
        if(this.cwd[target][name] !== undefined){
            throw new Error("Node already exists, id of: " + this.cwd[target][name].id);
        }

        //call the ctor, adding to the target
        if(constructor && this.cwd[target]){
            var newNode;
            if(target === "parents"){
                newNode = new constructor(name);
                newNode.children[this.cwd.id] = this.cwd;
            }else{
                newNode = new constructor(name,this.cwd);
            }

            this.cwd[target][newNode.id] = newNode;

            //if the cwd has disconnected from parents
            //or disconnectedFrom children
            //remove from as appropriate
            if(this.cwd[target][this.disconnected.noParents.id]){
                this.rm(this.disconnected.noParents.id);
            }
            if(this.cwd[target][this.disconnected.noChildren.id]){
                this.rm(this.disconnected.noChildren.id);                
            };

            

            if(this.allNodes[newNode.id]){
                throw new Error("Node Id is already used");
            }
            
            //add all the children of the node as well,
            //using a recursive map, so *all* children are added
            var shellInstance = this;
            var addChildrenFn = function(d){
                if(shellInstance.allNodes[d.id]){
                    return;
                }
                shellInstance.allNodes[d.id] = d;
                _.values(d.children).map(addChildrenFn);
                _.values(d.parents).map(addChildrenFn);
            };

            addChildrenFn(newNode);
            return newNode;
        }
        throw new Error("Add Node general error");
    };
    
    //Add a rule to the current node, should be a rule container
    CompleteShell.prototype.addRule = function(name){
        if(this.cwd.tags.type !== "RuleContainer") throw new Error("Rules should be added to a rule container");
        var rule = new RDS.Rule(name);
        this.cwd.rules.push(rule);
        this.cwd.rulesByName[rule.name] = rule;
        return rule;
    };
    
    /**
       @params target The id (global) or name (local) to move to
    */
    CompleteShell.prototype.cd = function(target){
        //TODO: cd into a rule
        //If a number:
        if(target === ".."){
            if(this.cwd._originalParent){
                this.cd(this.cwd._originalParent.id);
            }else{
                var randomParent = randomChoice(Object.keys(this.cwd.parents));
                this.cd(this.cwd.parents[randomParent]);
            }
            return;
        }

        //id specified
        if(!isNaN(Number(target)) && this.allNodes[target]){
            this.cwd = this.allNodes[target];
            return;
        }
        
        //passed a name. convert it to an id
        var nameIdPairs = {};
        var children = this.cwd.children;
        Object.keys(children).map(function(d){
            this[d.name] = d.id;
        },nameIdPairs);//pay attention to the state arg
        var parents = this.cwd.parents;
        _.values(parents).map(function(d){
            this[d.name] = d.id;
        },nameIdPairs);//state arg

        //if you can find the target to move to:
        if(nameIdPairs[target]){
            this.cd(nameIdPairs[target]);
        }else{
            //cant find the target, complain
            throw new Error("Unrecognised cd form");
        }
    };
    
    CompleteShell.prototype.getNodeListByIds = function(idList){
        var tempShell = this;
        var retList = [];
        idList.map(function(d){
            if(tempShell.allNodes[d]){
                retList.push(tempShell.allNodes[d]);
            }            
        });
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
    CompleteShell.prototype.link = function(target,id){
        if(isNaN(Number(id))) throw new Error("id should be a global id number");
        if(this.allNodes[id] === undefined){
            throw new Error("Node for id " + id + " does not exist");
        }
        if(!this.cwd[target]) throw new Error("Unrecognised target");
        var nodeToLink = this.allNodes[id];
        this.cwd[target][nodeToLink.id] = this.allNodes[id];        
    };
    
    //Remove a node from the parent/child lists
    CompleteShell.prototype.rm = function(id){
        //is an id
        if(!isNaN(Number(id))){
            var id = Number(id);
            console.log("Removing:",id);
            var removed;
            if(this.cwd.parents[id]){
                //if removing a parent
                //ASSUMING NODES ARE STORED BY ID NOT NAME
                removed = this.cwd.parents[id];
                delete this.cwd.parents[id];
                delete removed.children[this.cwd.id];
            }else if(this.cwd.children[id]){
                //if removing a child
                removed = this.cwd.children[id];
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
                this.disconnected.noParents.children[removed.id] = removed;
                removed.parents[this.disconnected.noParents.id] = this.disconnected.noParents;
            }
            if(_.values(removed.children).filter(function(d){return d;}).length === 0){
                console.log("Storing in no children:",this.allNodes[2],removed);
                this.disconnected.noChildren.parents[removed.id] = removed;
                removed.children[this.disconnected.noChildren.id] = this.disconnected.noChildren;
            }
            //FINISHED REMOVING NUMERIC ID NODE
        }else{
            //is a NAME
            //loop over all children and parents looking for name
            //and delete it
            var name = id;
            var shell = this;
            var childRemoved = _.values(this.cwd.children).filter(function(d){ return d.name === name;});
            childRemoved.forEach(function(d){
                delete d.parents[shell.cwd.id];
                delete shell.cwd.children[d.id];
                console.log("deleted:",shell.cwd.children,d);
            });

            var parentRemoved = _.values(this.cwd.parents).filter(function(d){ return d.name === name;});
            parentRemoved.forEach(function(d){
                delete shell.cwd.parents[d.id];
                delete d.children[shell.cwd.id];
            });
            
            console.log(childRemoved,parentRemoved);
            if(childRemoved.length === 0 && parentRemoved.length === 0){
                throw new Error("No node found with id: " + id);
            }

            //cleanup and connect any nodes to noParents/Children if neccesary:
            console.log("cleaning up from name delete");
            parentRemoved.concat(childRemoved).map(function(d){
                console.log("testing:",d);
                console.log(_.values(d.parents).filter(function(d){return d;}));
                if(_.values(d.parents).filter(function(d){return d;}).length === 0){
                    console.log("disconnected");
                    this.disconnected.noParents.children[d.id] = d;
                    d.parents[this.disconnected.noParents.id] = this.disconnected.noParents;
                }
                if(_.values(d.children).filter(function(d){return d;}).length === 0){
                    console.log("disconnected2");
                    this.disconnected.noChildren.parents[d.id] = d;
                    d.children[this.disconnected.noChildren.id] = this.disconnected.noChildren;
                }
            },this);//this as arg, so this= shell still

            
            //FINISHED REMOVING A NUMERIC SPECIFIED NODE
        }
    };
    
    CompleteShell.prototype.rename = function(name){
        this.cwd.name = name;
    };
    
    
    //ie: toVar  <- wme.fromVar
    //a <- wme.first
    CompleteShell.prototype.addBinding = function(conditionNum,toVar,FromVar){
        //chekc that you are in a rule
        //add or change the binding
        
    };
    
    
    //conversion to simple arrays for visualisation
    //export/import json

    //Interface of potential objects, used in addNode lookup,
    //which defaults to lowercase
    var interface =  {
        "CompleteShell":CompleteShell,
        "shell"     : CompleteShell,
        "graphnode" : GraphNode,
        "node"      : GraphNode,
        "role"      : Role,
        "institution":Institution,
        "activity"  : Activity,
        "rulecontainer":RuleContainer,
        "rule"      : RDS.Rule,
        "condition" : RDS.Condition,
        "test"      : RDS.Test,
        "action"    : RDS.ActionDescription,
    };
    return interface;
});
