//an idea for a complete shell
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['./ReteDataStructures','./ReteProcedures','underscore','./GraphNode','./GraphStructureConstructors','./utils'],function(RDS,RPS,_,GraphNode,DSCtors,util){
    if(RDS === undefined) throw new Error("RDS Not Loaded");
    if(RPS === undefined) throw new Error("RPS Not Loaded");
    if(GraphNode === undefined) throw new Error("DS not loaded");
    if(DSCtors === undefined) throw new Error("DSCtors not loaded");
    if(_ === undefined) throw new Error("Underscore not loaded");

    /**The Main Shell class, provides interfaces for interacting with nodes, rules, and rete
       @class CompleteShell
    */
    var CompleteShell = function(){
        this.tags = {};
        this.tags.type = 'Shell';
        //the root node
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

        //stashed locations:
        this._nodeStash = [];
        this.previousLocation = 0;

        //Integrated Rete Net:
        this.reteNet = new RDS.ReteNet();
        
    };

    //END OF DATA STRUCTURE
    //----------------------------------------
    /*
      Methods organised thus:
      0) json loading and methods
      1) addition of nodes, conditions, tests, actions,links etc
      2) modification of nodes, conditions, tests, actions etc
      3) deletion of nodes....

      4) Rete Methods: clearing, compiling, assertion

      5) utility to string methods

      6) SEARCH

      7) state change methods

    */

    //------------------------------
    // JSON Method prototype
    //------------------------------
    
    //export/import json
    //As nodes only store ID numbers, its non-cyclic. meaning json
    //should be straightforward.
    CompleteShell.prototype.exportJson = function(){
        var graphJson = JSON.stringify(_.values(this.allNodes),undefined,4);
        console.log("Converted to JSON:",graphJson);
        return graphJson;
    };

    //Loading json data means creating
    //assumes an... object of nodes, NOT an array
    CompleteShell.prototype.importJson = function(allNodes){
        console.log("importing type:", typeof allNodes);
        if(allNodes instanceof Array){
            allNodes.map(function(d){
                this.addNodeFromJson(d);
            },this);
        }else{
            _.values(allNodes).map(function(d){
                this.addNodeFromJson(d);
            },this);
        }
        this.cwd = this.allNodes[0];
    };

    //add a node from its json representation
    CompleteShell.prototype.addNodeFromJson = function(obj){
        //console.log("Loading Object:",obj);
        var newNode = new GraphNode(obj.name,obj._originalParent,obj.parents[obj._originalParent],obj.type,obj.id);
        _.keys(obj).forEach(function(d){
            newNode[d] = obj[d];
        });
        
        if(newNode.id !== obj.id) throw new Error("Ids need to match");
        if(this.allNodes[newNode.id] !== undefined){
            console.warn("Json loading into existing node:",newNode,this.allNodes[newNode.id]);
        }
        this.allNodes[newNode.id] = newNode;

        //If necessary (from older versions)
        //swap the keys/values pairings in children/parents
        var keys = _.keys(newNode.children);
        if(keys.length > 0 && isNaN(Number(keys[0]))){
            //console.log("Converting from old format");
            newNode.children = this.convertObject(newNode.children);
        }

        keys = _.keys(newNode.parents);
        if(keys.length > 0 && isNaN(Number(keys[0]))){
            //console.log("Converting from old format");
            newNode.parents = this.convertObject(newNode.parents);
        }
        return newNode;
    };


    //switch the keys and values of an object
    //used for legacy json format
    CompleteShell.prototype.convertObject = function(object){
        var keys = _.keys(object);
        var values = _.values(object);
        var newObject = {};
        _.zip(values,keys).forEach(function(d){
            newObject[d[0]] = d[1];
        });

        return newObject;
    };


    //------------------------------
    // addition method prototype
    //------------------------------

    
    //Utility method to add children to a node:
    CompleteShell.prototype.addLink = function(node,target,id,name){
        if(isNaN(Number(id))){
            throw new Error("Trying to link without providing a value id number");
        }
        if(node && node[target]){
            node[target][Number(id)] = name;
        }else{
            throw new Error("Unrecognised target");
        }
    };

    
    //add a node manually / through user interface
    CompleteShell.prototype.addNode = function(name,target,type){
        //validate:
        if(this.cwd[target] === undefined) throw new Error("Unknown target");
        type = type || "GraphNode";
        
        var newNode;
        if(target === 'parents' || target === 'parent'){
            //if adding to parents,don't store the cwd as newnode's parent
            newNode = new GraphNode(name,undefined,undefined,type);
            //add the cwd to the newNodes children:
            this.addLink(newNode,'children',this.cwd.id,this.cwd.name);
            //newNode.children[this.cwd.id] = true;
        }else{
            newNode = new GraphNode(name,this.cwd.id,this.cwd.name,type);
        }

        //add to cwd:
        //console.log("Linking new node:",newNode);
        this.addLink(this.cwd,target,newNode.id,newNode.name);

        //Store in allNodes:
        if(this.allNodes[newNode.id] !== undefined){
            console.warn("Assigning to existing node:",newNode,this.allNodes[newNode.id]);
        }
        this.allNodes[newNode.id] = newNode;

        
        //Extend the structure as necessary:
        if(DSCtors[type] !== undefined){
            console.log("Calling ctor:",type);
            var newChildren = DSCtors[type](newNode);
            if(newChildren && newChildren.length > 0){
                var flatChildren = _.flatten(newChildren);
                flatChildren.forEach(function(d){
                    if(this.allNodes[d.id] !== undefined){
                        console.warn("Assigning to existing node:",d,this.allNodes[d.id]);
                    }
                    this.allNodes[d.id] = d;
                },this);
            }
        }else if(type !== 'GraphNode'){
            console.log("No ctor for:",type);
        }

        //If the cwd WAS disconnected in some way,
        //remove it from that designation
        if(this.cwd[target][this.disconnected.noParents.id]){
            this.rm(this.disconnected.noParents.id);
        }
        if(this.cwd[target][this.disconnected.noChildren.id]){
            this.rm(this.disconnected.noChildren.id);                
        }
        
        return newNode;        
    };

    CompleteShell.prototype.addCondition = function(){
        if(this.cwd.tags.type !== 'rule'){
            throw new Error("Trying to modify a rule when not located at a rule");
        }
        var cond = new RDS.Condition();
        this.cwd.conditions.push(cond);
    };

    CompleteShell.prototype.addTest = function(conditionNumber,testField,op,value){
        console.log("Adding test:",conditionNumber,testField,op,value,this.cwd.conditions);
        if(this.cwd.tags.type !== 'rule'){
            throw new Error("Trying to modify a rule when not located at a rule");
        }

        if(this.cwd.conditions[conditionNumber] === undefined){
            console.log(conditionNumber,this.cwd.conditions);
            throw new Error("Can't add a test to a non-existent condition");
        }
        var test = new RDS.ConstantTest(testField,op,value);
        this.cwd.conditions[conditionNumber].constantTests.push(test);
    };

    
    CompleteShell.prototype.addAction = function(valueArray){
        if(this.cwd.tags.type !== 'rule'){
            throw new Error("Trying to modify a rule when not located at a rule");
        }

        //add an action node to cwd.actions
        var newActions = valueArray.map(function(d){
            console.log("Creating new action:",d);
            return this.addNode(valueArray[0],'actions','action');
        },this);
        return newActions;        
    };

    //------------------------------
    // modify method prototype
    //------------------------------

    CompleteShell.prototype.rename = function(name){
        this.cwd.name = name;
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
        //validate:
        if(isNaN(Number(id))) throw new Error("id should be a global id number");
        if(this.allNodes[id] === undefined){
            throw new Error("Node for id " + id + " does not exist");
        }
        if(!this.cwd[target]) throw new Error("Unrecognised target");

        //perform the link:
        var nodeToLink = this.allNodes[id];
        this.addLink(this.cwd,target,nodeToLink.id,nodeToLink.name);
        //this.cwd[target][nodeToLink.id] = true; //this.allNodes[id];
        if(reciprocal){
            var rTarget = 'parents';
            if(target === 'parents') rTarget = 'children';
            this.addLink(nodeToLink,rTarget,this.cwd.id,this.cwd.name);
            //nodeToLink[rtarget][this.cwd.id] = true; //this.cwd;
        }
    };


    
    //ie: toVar  <- wme.fromVar
    //a <- wme.first
    CompleteShell.prototype.setBinding = function(conditionNum,toVar,fromVar){
        console.log("Add binding to:",conditionNum,toVar,fromVar);
        if(this.cwd.tags.type !== 'rule'){
            throw new Error("Trying to modify a rule when not located at a rule");
        }
        if(this.cwd.conditions[conditionNum] === undefined){
            throw new Error("Can't add binding to non=existent condition");
        }
        this.cwd.conditions[conditionNum].bindings[toVar] = fromVar;
    };

    CompleteShell.prototype.setArithmetic = function(actionNum,varName,op,value){
        if(this.cwd.tags.type !== 'rule'){
            throw new Error("Arithmetic can only be applied to actions of rules");
        }
        if(this.cwd.actions[actionNum] === undefined){
            throw new Error("Cannot add arithmetic to non-existent action");
        }
        this.cwd.actions[actionNum].arithmeticActions[varName] = [op,value];
    };

    
    CompleteShell.prototype.setActionValue = function(actionNum,a,b){
        if(this.cwd.tags.type !== 'rule'){
            throw new Error("Can't set action values on non-actions");
        }
        if(this.cwd.actions[actionNum] !== undefined){
            if(b){
                this.cwd.actions[actionNum].values[a] = b;
            }else{
                this.cwd.actions[actionNum].tags.actionType = a;
            }
        }
    };

    CompleteShell.prototype.setActionData = function(actionNum,varName,varValue){
        if(this.cwd.tags.type !== 'rule'){
            throw new Error('Can not set action data on a non-rule');
        }
        if(this.cwd.actions[actionNum] === undefined){
            throw new Error('Can not set action data on non-existent action');
        }
        this.cwd.actions[actionNum].values[varName] = varValue;
    };

    CompleteShell.prototype.setTest = function(conNum,testNum,field,op,val){
        if(this.cwd.tags.type !== 'rule'){
            throw new Error("Trying to set test on a non-rule node");
        }
        if(this.cwd.conditions[conNum] === undefined || this.cwd.conditions[conNum].constantTests[testNum] === undefined){
            throw new Error("trying to set non-existent test");
        }
        this.cwd.conditions[conNum].constantTests[testNum].field = field;
        this.cwd.conditions[conNum].constantTests[testNum].operator = op;
        this.cwd.conditions[conNum].constantTests[testNum].value = val;
    };

    //------------------------------
    // Removal Methods prototype
    //------------------------------


    //completely delete a node:
    CompleteShell.prototype.deleteNode = function(id){
        if(this.allNodes[id] === undefined){
            throw new Error("unrecognised node to delete");
        }
        this.allNodes.splice(id,1);
    };

    CompleteShell.prototype.rm = function(nodeToDelete){
        var removedNode = null;
        if(!isNaN(Number(nodeToDelete))){
            //delete numeric id node
            removedNode = this.removeNumericId(Number(nodeToDelete),'parents');
            if(!removedNode){
                removedNode = this.removeNumericId(Number(nodeToDelete),'children');
            }
        }else{
            throw new Error("Removing a node requires an id");
        }

        if(removedNode){
            this.cleanupNode(removedNode,this.cwd);
        }
    };

    CompleteShell.prototype.removeNumericId = function(id,target){
        var removedNode = null;
        if(this.cwd[target][id] !== undefined){
            removedNode = this.allNodes[id];
            delete this.cwd[target][id];
        }
        return removedNode;
    };

    CompleteShell.prototype.cleanupNode = function(node,owningNode){
        //remove the owning node from any link in the node:
        if(node.parents && node.parents[owningNode.id]){
            delete node.parents[owningNode.id];
        }
        if(node.children && node.children[owningNode.id]){
            delete node.children[owningNode.id];
        }
        
        //if now parent-less:
        if(_.values(node.parents).filter(function(d){return d;}).length === 0){
            this.addLink(this.disconnected.noParents,'children',node.id,node.name);
            this.addLink(node,'parents',this.disconnected.noParents.id,this.disconnected.noParents.name);
        }
        //if now child-less:
        if(_.values(node.children).filter(function(d){return d;}).length === 0){
            
            this.addLink(this.disconnected.noChildren,'parents',node.id,node.name);
            this.addLink(node,'children',this.disconnected.noChildren.id,this.disconnected.noChildren.name);
        }
    };
    //RM FINISHED

    
    //note: an action is still a node, so is still in allnodes
    CompleteShell.prototype.removeAction = function(actionNum){
        if(this.cwd.actions[actionNum] === undefined){
            throw new Error("Can't delete a non-existent action");
        }
        //remove from the rule
        this.cwd.actions.splice(actionNum,1);
        //remove from allnodes
        
    };

    CompleteShell.prototype.removeCondition = function(condNum){
        if(this.cwd.conditions[condNum] === undefined){
            throw new Error("Can't delete an non-existent condition");
        }
        this.cwd.conditions.splice(condNum,1);
    };

    CompleteShell.prototype.removeTest = function(condNum,testNum){
        if(this.cwd.conditions[condNum] === undefined || this.cwd.conditions[condNum].contantTests[testNum] === undefined){
            throw new Error("can't delete a non-existent test");
        }

        this.cwd.conditions[condNum].constantTests.splice(testNum,1);        
    };



    //------------------------------
    // Rete Method prototype
    //------------------------------
    
    //RETE INTEGRATION METHODS:
    CompleteShell.prototype.clearRete = function(){
        this.reteNet = new RDS.ReteNet();
    };

    CompleteShell.prototype.clearActivatedRules = function(){
        this.reteNet.activatedRules = [];
    };
    
    CompleteShell.prototype.compileRete = function(){
        //take all defined rules
        var rules = _.values(this.allNodes).filter(function(d){
            return d.tags.type === 'rule';
        });
        //and add them to the rete net
        //returning the action nodes of the net
        this.allActionNodes = rules.map(function(d){
            var action = RPS.addRule(d,this.reteNet);
            //TODO: store the returned node inside the shell's nodes?
            return action;
        },this);
    };

    CompleteShell.prototype.clearActivationsOfReteNet = function(){
        return RPS.clearActivations(this.reteNet);
    };
    

    CompleteShell.prototype.assertChildren = function(){
        var children = _.keys(this.cwd.children).map(function(d){
            return this.allNodes[d].values;
        });

        this.assertWMEList(children);
        
    };
    
    CompleteShell.prototype.assertWMEList = function(array){
        if(!(array instanceof Array)){
            throw new Error("Asserting should be in the form of an array");
        }

        var newWMEs = array.map(function(d){
            return RPS.addWME(d,this.reteNet);
        },this);

        return newWMEs;
    };

    
    //------------------------------
    // Utility string method prototype
    //------------------------------
    CompleteShell.prototype.getNodeListByIds = function(idList){
        var retList = idList.map(function(d){
            if(this.allNodes[d]){
                return this.allNodes[d];
            }            
        },this).filter(function(d){ return d;});
        return retList;
    };
    
    //Utility functions for display Output:    
    CompleteShell.prototype.nodeToShortString = function(node,i){
        if(node.name){
            return "(" + node.id + "): " + node.name + " (" + node.tags.type + ")";
        }else{
            return "(" + node.id + "): (" + node.tags.type + ")";
        }
    };

    CompleteShell.prototype.nodeToStringList = function(node){
        return [];
    };

    CompleteShell.prototype.ruleToStringList = function(node){
        var retList = [];
        retList.push("(" + node.id +"): " + node.name);
        return retList;
    };
    
    
    CompleteShell.prototype.getListsFromNode = function(node,fieldNameList){
        var allArrays = fieldNameList.map(function(d){
            if(node[d] !== undefined){
                if(d !== 'id' && d !== 'name'){
                    return ["","| "+d+" |"].concat(this.getListFromNode(node,d));
                }else{
                    return d + ": " + node[d];
                }
            }else{
                console.log("Could not find:",d,node);
            }
        },this);
        return _.flatten(allArrays);
    };

    CompleteShell.prototype.getListFromNode = function(node,fieldName){
        if(node[fieldName] === undefined) throw new Error("Unrecognised field: "+fieldName);
        var retArray = _.keys(node[fieldName]).map(function(d){
            return d + ": " + this[fieldName][d];
        },node);
        return retArray;
    };

    //Do a pwd to the root, or highest parent otherwise
    CompleteShell.prototype.pwd = function(){

    };

    //------------------------------
    // SEARCH method prototype
    //------------------------------
    
    /**
       SEARCH {whereToLook} {WhatToLookFor} {KeyOrValue}

       //eg: find all nodes matching a pattern:
       // search name blah

       //eg: find the node with a specified id:
       // search id 5

       //eg2: find all nodes with children's names matching a pattern:
       // search children blah

       //eg3: find all nodes with a specific node as a child
       // search children 5 id

       //eg4: find all nodes where a value of an object  matches a pattern:
       // search values bob value

       //eg5: find all nodes where keys(values) contains a pattern
       // search values bob key

       
       search ALL NODES for ones that have the specified property
       namely, that they have a particular connection
    */
    
    CompleteShell.prototype.search = function(target,regex,type){
        //Switch parents and children around:
        //This makes more sense as you can then "search children 3"
        //and get back the children of node 3,
        //while "search parents 3" will get the nodes that parent 3
        var possibleTargets = {
            "parents" : "children",
            "children" : "parents"
        };
        
        var targetToUse = possibleTargets[target] || target;

        if(targetToUse === target){
            if(type === "key"){
                return this.searchForKey(target,regex);
            }else{
                return this.searchForValue(target,regex);
            }
        }else{
            if(!isNaN(Number(regex))){
                return this.searchForKey(targetToUse,regex);
            }else{
                return this.searchForValue(targetToUse,regex);
            }
        }
    };


    CompleteShell.prototype.searchForValue = function(target,regex){
        console.log("searching by value:",target,regex);
        //if searching by name, or the value stored in a location
        var pattern = new RegExp(regex);
        var matchingNodes = _.values(this.allNodes).filter(function(node){
            if(target === 'name'){
                //ie: search name blah
                return pattern.test(node.name);
            }else if(node[target] === undefined){
                //ie: search somethingUndefined blah
                console.log("Skipping node without target:",target,node);
                return false;
            }else{
                //ie: search children blah
                //ie: search values bob, where values = { a: "bob"}
                var value =  _.some(_.values(node[target]),function(d){
                    return pattern.test(d);
                });
                return value;
            }
        });
        return matchingNodes;
    };


    CompleteShell.prototype.searchForKey = function(target,keyVal){
        console.log("searching by key");
        var targetId = Number(keyVal);
        var pattern = new RegExp(keyVal);
        if(target === 'id' && isNaN(targetId)){
            throw new Error("searching for an id requires a number");
        }
        var matchingNodes = _.values(this.allNodes).filter(function(node){
            if(target === 'id'){
                //ie: search id 5
                return node.id === Number(keyVal);
            }else if(node[target] === undefined){
                //ie: search somethingUndefined 5
                console.log("skipping node without target:",target,node);
                return false;
            }else if(target === 'parents' || target === 'children'){
                //ie: search children 5
                return _.some(_.keys(node[target]),function(d){
                    //console.log("Comparing:",d,targetId,Number(d) === targetId);
                    return Number(d) === targetId;
                });
            }else{
                //ie: search values bob, where values = {"bob": a}
                return _.some(_.keys(node[target]),function(d){
                    return pattern.test(d);
                });
            }
        });
        return matchingNodes;
    };

    //------------------------------    
    // State Change method prototype
    //------------------------------
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
            //console.log("cd : ", Number(target));
            this.cwd = this.allNodes[Number(target)];
            return;
        }
        
        //passed a name. convert it to an id
        //console.log("Cd-ing: ",target);
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

        //console.log("Available keys:",_.keys(nameIdPairs));
        //if you can find the target to move to:
        if(nameIdPairs[target]){
            this.cd(nameIdPairs[target]);
        }else{
            //cant find the target, complain
            throw new Error("Unrecognised cd form");
        }
    };
    
    //Stashing and unstashing:
    CompleteShell.prototype.stash = function(){
        this._nodeStash.push(this.cwd);
    };

    CompleteShell.prototype.unstash = function(){
        if(this._nodeStash.length > 0){
            this.cd(this._nodeStash.pop().id);
        }
    };

    CompleteShell.prototype.top = function(){
        if(this._nodeStash.length > 0){
            this.cd(this._nodeStash[this._nodeStash.length - 1].id);
        }
    };
    
    
    //Interface of potential objects, used in addNode lookup,
    //which defaults to lowercase
    var interface =  {
        "CompleteShell":CompleteShell,
        "shell"     : CompleteShell,
    };
    return interface;
});
