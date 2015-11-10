/**
   @file TotalShell
   @purpose Describes the top level Shell class, allowing authoring of a graph structure
   and integration with Rete based rule engine
 */
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['./ReteDataStructures','./ReteProcedures','./ReteComparisonOperators','underscore','./GraphNode','./GraphStructureConstructors','./utils'],function(RDS,RPS,RCO,_,GraphNode,DSCtors,util){
    if(RDS === undefined) throw new Error("RDS Not Loaded");
    if(RPS === undefined) throw new Error("RPS Not Loaded");
    if(GraphNode === undefined) throw new Error("DS not loaded");
    if(DSCtors === undefined) throw new Error("DSCtors not loaded");
    if(_ === undefined) throw new Error("Underscore not loaded");

    /**
       @class CompleteShell
       @constructor
       @purpose The Main Shell class, provides interfaces for interacting with nodes, rules, and rete
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

        //last search results:
        this.lastSearchResults = [];

        //Integrated Rete Net:
        this.reteNet = new RDS.ReteNet();
        
    };

    //END OF DATA STRUCTURE
    //----------------------------------------
    /*
      Methods organised as follows:
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

    /**
       @class CompleteShell
       @method exportJson
       @purpose Converts all defined nodes to a json array of objects
       @return A JSON string

       @note As nodes only store ID numbers, the information does not contain cycles
     */
    CompleteShell.prototype.exportJson = function(){
        var graphJson = JSON.stringify(_.values(this.allNodes),undefined,4);
        console.log("Converted to JSON:",graphJson);
        return graphJson;
    };

    /**
       @class CompleteShell
       @method importJson
       @purpose To create a graph based on an incoming array of objects
       @param allNodes an array or object of key:object pairs describing all nodes to load
     */
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

    /**
       @class CompleteShell
       @method addNodeFromJson
       @purpose create a node from loaded json data, forcing a specific ID number
       @param obj The object data to use for the node
       @return a new node object
     */
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

    /**
       @class CompleteShell
       @method convertObject
       @purpose convert old style links of name->id to new style id->name
       @param object The object to switch around
       @return an output object of value:key pairs
    */
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
    // addition methods
    //------------------------------

    /**
       @class CompleteShell
       @method addLink
       @purpose Add an ID number and name to a field of an object
       @param node the node to add the link FROM
       @param target the field of the node to link FROM
       @param id the id of the node to link TO
       @param name the name of the node to link TO
    */
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


    /**
       @class CompleteShell
       @method addNode
       @purpose Create a new node, and link it to the cwd of the shell
       @param name The name of the new node
       @param target The field of the cwd to add the new node to
       @param type The type of node the new node should be annotated as. See GraphStructureConstructors
       @return the newly created node
    */
    CompleteShell.prototype.addNode = function(name,target,type){
        //validate input:
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

        
        //Extend the structure of the new node as necessary:
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

    /**
       @class CompleteShell
       @method addCondition
       @purpose Add a new condition to the current rule
    */
    CompleteShell.prototype.addCondition = function(){
        if(this.cwd.tags.type !== 'rule'){
            throw new Error("Trying to modify a rule when not located at a rule");
        }
        var cond = new RDS.Condition();
        this.cwd.conditions.push(cond);
    };

    /**
       @class CompleteShell
       @method addTest
       @purpose Add a constant test to a specified condition of the current rule
       @param conditionNumber The position in the condition array to add the test to
       @param testField the wme field to test
       @param op The operator to use in the test
       @param value The constant value to test against
     */
    CompleteShell.prototype.addTest = function(conditionNumber,testField,op,value){
        console.log("Adding test:",conditionNumber,testField,op,value,this.cwd.conditions);
        if(this.cwd.tags.type !== 'rule'){
            throw new Error("Trying to modify a rule when not located at a rule");
        }

        if(this.cwd.conditions[conditionNumber] === undefined){
            console.log(conditionNumber,this.cwd.conditions);
            throw new Error("Can't add a test to a non-existent condition");
        }

        //Check the operator is a defined one
        if(RCO[op] === undefined){
            throw new Error("Unrecognised operator");
        }
        
        var test = new RDS.ConstantTest(testField,op,value);
        this.cwd.conditions[conditionNumber].constantTests.push(test);
    };

    /**
       @class CompleteShell
       @method addAction
       @purpose add a new action to current rule
       @param valueArray The names of actions to create
       @return newActions an array of all actions created
    */
    CompleteShell.prototype.addAction = function(valueArray){
        if(this.cwd.tags.type !== 'rule'){
            throw new Error("Trying to modify a rule when not located at a rule");
        }

        //add an action node to cwd.actions
        var newActions = valueArray.map(function(d){
            console.log("Creating new action:",d);
            return this.addNode(d,'actions','action');
        },this);
        return newActions;        
    };

    //------------------------------
    // modify method prototype
    //------------------------------

    /**
       @class CompleteShell
       @method rename
       @purpose rename the current nodes name
       @param name The name to rename to
     */
    CompleteShell.prototype.rename = function(name){
        this.cwd.name = name;
    };

    /**
       @class CompleteShell
       @method setParameter
       @purpose Set a key:value pair in the node[field] to value
       @param field
       @param parameter
       @param value
     */
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


    /**
       @class CompleteShell
       @method link
       @purpose Interface method to add a link to the cwd. can be reciprocal
       @param target The field of the node to add the link to
       @param id The id of the node being linked towards
       @param reciprocal Whether the node of id will have a link back
     */
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


    /**
       @class CompleteShell
       @method setBinding
       @purpose Set/Add a binding pair to a condition in a rule
       @param conditionNum The condition to add the binding to
       @param toVar The variable name to use as the bound name
       @param fromVar the wme field to bind

       @ie: toVar = wme.fromVar
     */
    CompleteShell.prototype.setBinding = function(conditionNum,toVar,fromVar){
        console.log("Add binding to:",conditionNum,toVar,fromVar);
        if(this.cwd.tags.type !== 'rule'){
            throw new Error("Trying to modify a rule when not located at a rule");
        }
        if(this.cwd.conditions[conditionNum] === undefined){
            throw new Error("Can't add binding to non=existent condition");
        }
        this.cwd.conditions[conditionNum].bindings.push([toVar,fromVar]);
        console.log(this.cwd.conditions[conditionNum].bindings);
    };

    /**
       @class CompleteShell
       @method setArithmetic
       @purpose set an arithmetic operation for an action
       @param actionNum The action to add the operation to
       @param varName the variable to change
       @param op the operator to use. ie: + - * / ....
       @param value The value to apply to the varName

       @TODO allow bindings in the rhs/value field
     */
    CompleteShell.prototype.setArithmetic = function(actionNum,varName,op,value){
        console.log("Setting arithmetic of:",actionNum,varName,op,value);
        console.log(_.keys(this.cwd.actions));
        if(this.cwd.tags.type !== 'rule'){
            throw new Error("Arithmetic can only be applied to actions of rules");
        }
        if(_.keys(this.cwd.actions).length < actionNum){
            throw new Error("Cannot add arithmetic to non-existent action");
        }
        var actionId = _.keys(this.cwd.actions)[actionNum];
        var action = this.allNodes[actionId];

        if(action === undefined){
            throw new Error("Could not find action");
        }

        if(op && value){
            action.arithmeticActions[varName] = [op,value];
        }else{
            delete action.arithmeticActions[varName];
        }
    };

    /**
       @class CompleteShell
       @method setActionValue
       @purpose Set an internal value of an action, without going into that node itself
       @param actionNum The action to target
       @param a The parameter name
       @param b The parameter value

       @note If only a is supplied, sets the action's actionType tag
     */
    CompleteShell.prototype.setActionValue = function(actionNum,a,b){
        if(this.cwd.tags.type !== 'rule'){
            throw new Error("Can't set action values on non-actions");
        }
        if(_.keys(this.cwd.actions).length > actionNum){
            var actionId = _.keys(this.cwd.actions)[actionNum];
            console.log("Action Id:",actionId);
            var action = this.allNodes[actionId];
            console.log(action);
            if(b){
                action.values[a] = b;
            }else{
                action.tags.actionType = a;
            }
        }else{
            throw new Error("Unrecognised action");
        }
    };

    //* @deprecated
    /*
    CompleteShell.prototype.setActionData = function(actionNum,varName,varValue){
        if(this.cwd.tags.type !== 'rule'){
            throw new Error('Can not set action data on a non-rule');
        }

        var actionId = _.keys(this.cwd.actions)[actionNum];
        var action = this.allNodes[actionId];
                
        if(action === undefined){
            throw new Error('Can not set action data on non-existent action');
        }
        
        action.values[varName] = varValue;
    };
    */

    /**
       @class CompleteShell
       @method setTest
       @purpose add/modify a constant test of a condition
       @param conNum the condition to target
       @param testNum the test to target
       @param field the wme field to test
       @param op The operator to test using
       @param val the value to test against
     */
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

    /**
       @class CompleteShell
       @method deleteNode
       @purpose remove a node from the list of all nodes
       @param id The id of the node to remove
     */
    CompleteShell.prototype.deleteNode = function(id){
        if(this.allNodes[id] === undefined){
            throw new Error("unrecognised node to delete");
        }
        this.allNodes.splice(id,1);
    };

    /**
       @class CompleteShell
       @method rm
       @purpose remove a node link from the cwd
       @param nodeToDelete The node object to remove from the cwd
     */
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

    /**
       @class CompleteShell
       @method removeNumericId
       @param id
       @param target
       @TODO check this
     */
    CompleteShell.prototype.removeNumericId = function(id,target){
        var removedNode = null;
        if(this.cwd[target][id] !== undefined){
            removedNode = this.allNodes[id];
            delete this.cwd[target][id];
        }
        return removedNode;
    };

    /**
       @class CompleteShell
       @method cleanupNode
       @purpose To link a node to the disconnected nodes if it no longer has active links
       @param node
       @param owningNode
     */
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

    /**
       @class CompleteShell
       @method removeAction
       @purpose remove an action from the current rule
       @note: an action is still a node, so is still in allnodes
     */
    CompleteShell.prototype.removeAction = function(actionNum){
        if(this.cwd.actions[actionNum] === undefined){
            throw new Error("Can't delete a non-existent action");
        }
        //remove from the rule
        this.cwd.actions.splice(actionNum,1);
        //remove from allnodes
    };

    /**
       @class CompleteShell
       @method removeCondition
       @purpose remove a condition, and its tests, from a rule
     */
    CompleteShell.prototype.removeCondition = function(condNum){
        if(this.cwd.conditions[condNum] === undefined){
            throw new Error("Can't delete an non-existent condition");
        }
        this.cwd.conditions.splice(condNum,1);
    };

    /**
       @class CompleteShell
       @method removeTest
       @purpose remove a test from a condition
       @param condNum
       @param testNum
     */
    CompleteShell.prototype.removeTest = function(condNum,testNum){
        if(this.cwd.conditions[condNum] === undefined || this.cwd.conditions[condNum].constantTests[testNum] === undefined){
            throw new Error("can't delete a non-existent test");
        }

        this.cwd.conditions[condNum].constantTests.splice(testNum,1);        
    };

    //------------------------------
    // Rete Integration Methods
    //------------------------------

    /**
       @class CompleteShell
       @method clearRete
       @purpose Completely reset the retenet, by building a new one
     */
    CompleteShell.prototype.clearRete = function(){
        this.reteNet = new RDS.ReteNet();
    };

    /**
       @class CompleteShell
       @method clearActivatedRules
       @purpose Clear the record of recently activated rules
     */
    CompleteShell.prototype.clearActivatedRules = function(){
        this.reteNet.activatedRules = [];
    };
    
    /**
       @class CompleteShell
       @method clearActivationsOfReteNet
       @purpose To clear the record of activations
       @TODO check this, may be a duplicate.
     */
    CompleteShell.prototype.clearActivationsOfReteNet = function(){
        return RPS.clearActivations(this.reteNet);
    };

    /**
       @class CompleteShell
       @method compileRete
       @purpose Retrieve all defined rules, add them to the rete net
     */    
    CompleteShell.prototype.compileRete = function(){
        //take all defined rules
        //TODO: make this all rules that are descendents of the current node?
        var rules = _.values(this.allNodes).filter(function(d){
            return d.tags.type === 'rule';
        });

        var copiedRules = rules.map(function(rule){
            var copy = _.clone(rule);
            copy.actions = _.keys(rule.actions).map(function(id){
                return this.allNodes[id];
            },this);
            return copy;
        },this);

        console.log("Compiling copied rules:",copiedRules);
        //and add them to the rete net
        //returning the action nodes of the net
        this.allActionNodes = copiedRules.map(function(d){
            console.log("Adding rule:",d);
            var action = RPS.addRule(d,this.reteNet);
            //TODO: store the returned node inside the shell's nodes?
            return action;
        },this);

        console.log("All action nodes:",this.allActionNodes);
    };

    /**
       @class CompleteShell
       @method assertChildren
       @purpose Assert all child nodes of the current node as facts
       using each nodes' values field
       @TODO: be able to detect bindings and resolve them prior to assertion?
     */
    CompleteShell.prototype.assertChildren = function(){
        var children = _.keys(this.cwd.children).map(function(d){
            return this.allNodes[d].values;
        },this);

        //TODO: store the wmes somewhere?
        this.assertWMEList(children);

        console.log("Finished Assertions")
        console.log("Activations:",this.reteNet.lastActivatedRules);

        //TODO: here, i could go through the assertions and modify the shell
        //using the wmes as command inputs
        //which would allow rule modification...
    };

    /**
       @class CompleteShell
       @method assertWMEList
       @purpose Taking a list of objects, add each as a wme to the retenet of the shell
       @param array An Array of objects
     */
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

    /**
       @class CompleteShell
       @method getNodeListByIds
       @utility
       @purpose To retrieve the actual node objects indicated by an array of ids
       @param idList
       @return array of node objects
     */
    CompleteShell.prototype.getNodeListByIds = function(idList){
        var retList = idList.map(function(d){
            if(this.allNodes[d]){
                return this.allNodes[d];
            }            
        },this).filter(function(d){ return d;});
        return retList;
    };
    
    //Utility functions for display Output:
    /**
       @class CompleteShell
       @method nodeToShortString
       @utility
       @purpose To convert a node to a text representation for display on screen
       @param node
       @param i
     */
    CompleteShell.prototype.nodeToShortString = function(node,i){
        console.log("NTSS:",node);
        if(node.tags.type === "action"){
            return "(" + i + "): " + node.name;
        }else if(node.name){
            return "(" + node.id + "): " + node.name + " (" + node.tags.type + ")";
        }else{
            return "(" + node.id + "): (" + node.tags.type + ")";
        }
    };

    /**
       @class CompleteShell
       @method nodeToStringList
       @utility
       @stub
       @purpose To convert a node to a list of strings
       @param node
     */
    CompleteShell.prototype.nodeToStringList = function(node){
        return [];
    };

    /**
       @class CompleteShell
       @method ruleToStringList
       @utility
       @purpose Convert a rule to a string representation
       @param node
     */
    CompleteShell.prototype.ruleToStringList = function(node){
        var retList = [];
        retList.push("(" + node.id +"): " + node.name);
        return retList;
    };
    
    /**
       @class CompleteShell
       @method getListsFromNode
       @purpose get a list of strings representating a field of a node
       @param node
       @param fieldNameList
       @return the flattened list of strings
     */
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

    /**
       @class CompleteShell
       @method getListFromNode
       @utility
       @purpose get a list of strings of the key value pairs for a nodes field
       @param node
       @param fieldName
     */
    CompleteShell.prototype.getListFromNode = function(node,fieldName){
        if(node[fieldName] === undefined) throw new Error("Unrecognised field: "+fieldName);
        var retArray = _.keys(node[fieldName]).map(function(d){
            return d + ": " + this[fieldName][d];
        },node);
        return retArray;
    };

    /**
       @class CompleteShell
       @method pwd
       @utility
       @stub
     */
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


    /**
       @class CompleteShell
       @method search
       @purpose To search all nodes for a given regex in the target field of the node
       @param target
       @param regex
       @param type id or key, to look for an id number or a text string
       @return a list of nodes
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
                this.lastSearchResults = this.searchForKey(target,regex);
            }else{
                this.lastSearchResults = this.searchForValue(target,regex);
            }
        }else{
            if(!isNaN(Number(regex))){
                this.lastSearchResults = this.searchForKey(targetToUse,regex);
            }else{
                this.lastSearchResults = this.searchForValue(targetToUse,regex);
            }
        }
        return this.lastSearchResults;
    };

    /**
       @class CompleteShell
       @method searchForValue
       @utility
       @purpose Utility method to search for a text value
       @param target
       @param regex
       @return a list of matching nodes
     */
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


    /**
       @class CompleteShell
       @method searchForKey
       @utility
       @purpose to search nodes for a given key in the target field
       @return a list of passing nodes
     */
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
       @class CompleteShell
       @method cd
       @purpose to move the cwd of the shell to a new location
       @params target The id (global) or name (local) to move to
    */
    CompleteShell.prototype.cd = function(target){
        if(this.cwd.tags.type !== "action"){
            this.cdNode(target);
        }else{
            this.cdRule(target);
        }
    };

    /**
       @class CompleteShell
       @method cdRule
       @stub
       @utility
       @purpose to move to components of a rule
       @param target
     */
    //cd based on relative position in rule, not by global id
    CompleteShell.prototype.cdRule = function(target){
        //if target[0] === "c": cd to condition

        //if(target[0] === "a": cd to action

    };

    
    /**
       @class CompleteShell
       @method cdNode
       @utility
       @purpose to move about normally, dealing with nodes
       @param target
     */
    CompleteShell.prototype.cdNode = function(target){
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

    /**
       @class CompleteShell
       @method stash
       @purpose add the cwd to the temporary stash for reference
     */
    CompleteShell.prototype.stash = function(){
        this._nodeStash.push(this.cwd);
    };

    /**
       @class CompleteShell
       @method unstash
       @purpose move to, and remove, the top element from the stash stack
    */
    CompleteShell.prototype.unstash = function(){
        if(this._nodeStash.length > 0){
            this.cd(this._nodeStash.pop().id);
        }
    };

    /**
       @class CompleteShell
       @method top
       @purpose To move to the top element of the stash stack, without removing it
     */
    CompleteShell.prototype.top = function(){
        if(this._nodeStash.length > 0){
            this.cd(this._nodeStash[this._nodeStash.length - 1].id);
        }
    };
    
    
    /**
       @interface The interface of the TotalShell file
       @exports CompleteShell 
       @alias Shell for CompleteShell
     */
    var interface =  {
        "CompleteShell":CompleteShell,
        "shell"        : CompleteShell,
    };
    return interface;
});
