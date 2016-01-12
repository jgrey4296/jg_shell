/**
   @file TotalShell
   @purpose Describes the top level Shell class, allowing authoring of a graph structure
   and integration with Rete based rule engine
 */
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
    var imports = ["./Rete/ReteInterface","../libs/underscore","./Node/GraphNode","./Node/GraphStructureConstructors","./utils"];
}else{
    var imports = ['ReteInterface','underscore','GraphNode','GraphStructureConstructors','./utils'];
}

define(imports,function(Rete,_,GraphNode,DSCtors,util){
    "use strict";
    if(Rete === undefined) throw new Error("Rete not loaded");
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
        //current node/rule, as an ACTUAL OBJECT, NOT AN ID
        this.cwd = this.root;

        //stashed locations:
        this._nodeStash = [];
        this.previousLocation = 0;

        //last search results:
        this.lastSearchResults = [];

        //Integrated Rete Net:
        this.reteNet = new Rete.ReteNet();
        
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
        //console.log("importing type:", typeof allNodes,allNodes.length);
        //clear the shell:
        this.allNodes = [];
        
        if(allNodes instanceof Array){
            allNodes.forEach(function(d){
                this.addNodeFromJson(d);
            },this);
        }else{
            _.values(allNodes).forEach(function(d){
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
        var keys = _.keys(object),
            values = _.values(object),
            newObject = {};
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
            throw new Error("Trying to link without providing a valid id number");
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
    CompleteShell.prototype.addNode = function(name,target,type,values,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;
        
        if(name === null) {
            name = type || "anon";
            console.warn("making an anonymous node");
        }
        //validate input:
        if(source[target] === undefined){ //throw new Error("Unknown target");
            console.warn("Creating target: ",target,source);
            source[target] = {};
        }
        type = type || "GraphNode";
        
        var newNode;
        if(target === 'parents' || target === 'parent'){
            //if adding to parents,don't store the cwd as newnode's parent
            newNode = new GraphNode(name,undefined,undefined,type);
            //add the cwd to the newNodes children:
            this.addLink(newNode,'children',source.id,source.name);
            //newNode.children[this.cwd.id] = true;
        }else{
            newNode = new GraphNode(name,source.id,source.name,type);
        }

        //add to cwd:
        //console.log("Linking new node:",newNode);
        this.addLink(source,target,newNode.id,newNode.name);

        //Store in allNodes:
        if(this.allNodes[newNode.id] !== undefined){
            console.warn("Assigning to existing node:",newNode,this.allNodes[newNode.id]);
        }
        this.allNodes[newNode.id] = newNode;
        
        //Extend the structure of the new node as necessary:
        if(DSCtors[type] !== undefined){
            console.log("Calling ctor:",type);
            var newChildren = DSCtors[type](newNode,values);
            if(newChildren && newChildren.length > 0){
                var flatChildren = _.flatten(newChildren);
                flatChildren.forEach(function(d){
                    if(this.allNodes[d.id] !== undefined){
                        console.warn("Overwriting existing node:",d,this.allNodes[d.id]);
                    }
                    this.allNodes[d.id] = d;
                },this);
            }
        }else if(type !== 'GraphNode' && type !== 'node'){
            console.warn("No ctor for:",type);
        }

        //If the cwd WAS disconnected in some way,
        //remove it from that designation
        if(source[target][this.disconnected.noParents.id]){
            this.rm(this.disconnected.noParents.id,source.id);
        }
        if(source[target][this.disconnected.noChildren.id]){
            this.rm(this.disconnected.noChildren.id,source.id);                
        }
        
        return newNode;        
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
    CompleteShell.prototype.addTest = function(conditionId,testParams,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;
        console.log("Adding test:",conditionId,testParams,source.conditions);
        //check you're in a rule
        if(source.tags.type !== 'rule'){
            throw new Error("Trying to modify a rule when not located at a rule");
        }
        //check the specified condition exists
        if(source.conditions[conditionId] === undefined || this.allNodes[conditionId] === undefined){
            console.log(conditionId,source.conditions);
            throw new Error("Can't add a test to a non-existent condition");
        }
        //Check the operator is a defined one
        if(Rete.CompOperators[testParams[1]] === undefined){
            throw new Error("Unrecognised operator");
        }
        var condition = this.allNodes[conditionId];
        //Create the test
        var test = new GraphNode(null,conditionId,condition.name,'constantTest');
        //link it to the condition
        this.addLink(this.allNodes[conditionId],"constantTests",test.id,"anonTest");
        //store the test as a node
        if(this.allNodes[test.id] !== undefined){
            console.warn("Assigning test to existing node: ", test,this.allNodes[test.id]);
        }
        this.allNodes[test.id] = test;

        //extend the node to be a test
        if(DSCtors.test === undefined) throw new Error("No ctor for test");
        DSCtors.test(test,testParams);
    };

    /**
       @class CompleteShell
       @method addAction
       @purpose add a new action to current rule
       @param valueArray The names of actions to create
       @return newActions an array of all actions created
    */
    CompleteShell.prototype.addAction = function(valueArray,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;
        if(source.tags.type !== 'rule'){
            throw new Error("Trying to modify a rule when not located at a rule");
        }
        var name = valueArray.shift() || "anonAction";
        
        //add an action node to cwd.actions
        var newAction = this.addNode(name,'actions','action',valueArray,sourceId);
        return newAction;
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
    CompleteShell.prototype.rename = function(name,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;
        source.name = name;
    };

    /**
       @class CompleteShell
       @method setParameter
       @purpose Set a key:value pair in the node[field] to value
       @param field
       @param parameter
       @param value
     */
    CompleteShell.prototype.setParameter = function(field,parameter,value,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;
        //if(!source[field]) throw new Error("Unrecognised field");
        //if(field !== 'values' && field !== 'tags' && field !== 'annotations'){
        //    throw new Error("Bad field");
        //}
        if(source[field] === undefined && field !== undefined){
            source[field] = {};
        }
        if(parameter === undefined && field !== 'values' && field !== 'tags' && field !== 'children' && field !== 'parents' && field !== 'name' && field !== 'id'){
            delete source[field];
        }else if(value !== undefined){
            source[field][parameter] = value;
        }else{
            //if no value is specified, remove the entry
            delete source[field][parameter];
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
    CompleteShell.prototype.link = function(target,id,reciprocal,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;

        //validate:
        if(isNaN(Number(id))) throw new Error("id should be a global id number");
        if(this.allNodes[id] === undefined){
            throw new Error("Node for id " + id + " does not exist");
        }
        if(!source[target]) throw new Error("Unrecognised target");

        //perform the link:
        var nodeToLink = this.allNodes[id];
        this.addLink(source,target,nodeToLink.id,nodeToLink.name);
        //this.cwd[target][nodeToLink.id] = true; //this.allNodes[id];
        if(reciprocal){
            var rTarget = 'parents';
            if(target === 'parents') rTarget = 'children';
            this.addLink(nodeToLink,rTarget,source.id,source.name);
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
    CompleteShell.prototype.setBinding = function(conditionId,toVar,fromVar,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;
        console.log("Add binding to:",conditionId,toVar,fromVar);
        if(source.tags.type !== 'rule'){
            throw new Error("Trying to modify a rule when not located at a rule");
        }
        if(source.conditions[conditionId] === undefined){
            throw new Error("Can't add binding to non=existent condition");
        }
        var condition = this.allNodes[conditionId];
        //condition.bindings.push([toVar,fromVar]);
        condition.bindings[toVar] = fromVar;
        console.log(source.conditions[conditionId].bindings);
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
    CompleteShell.prototype.setArithmetic = function(actionId,varName,op,value,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;
        console.log("Setting arithmetic of:",actionId,varName,op,value);
        console.log(_.keys(source.actions));
        if(source.tags.type !== 'rule'){
            throw new Error("Arithmetic can only be applied to actions of rules");
        }
        if(source.actions[actionId] === undefined){
            throw new Error("Cannot add arithmetic to non-existent action");
        }
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
    CompleteShell.prototype.setActionValue = function(actionId,a,b,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;
        if(source.tags.type !== 'rule'){
            throw new Error("Can't set action values on non-actions");
        }
        if(source.actions[actionId] !== undefined){
            var action = this.allNodes[actionId];
            if(b){
                action.values[a] = b;
            }else{
                delete action.values[a];
            }
        }else{
            throw new Error("Unrecognised action");
        }
    };

    /**
       @class CompleteShell
       @method setActionType
       @param actionNum
       @param a the type
     */
    CompleteShell.prototype.setActionType = function(actionId,a,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;
        if(source.tags.type !== 'rule'){
            throw new Error("Can't set action type for non-rules");
        }
        if(source.actions[actionId] !== undefined){
            var action = this.allNodes[actionId];
            if(a){
                action.tags.actionType = a;
            }else{
                throw new Error("Setting action type requires a type be specified");
            }
        }else{
            throw new Error("Unrecognised action");
        }
    };
    
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
    CompleteShell.prototype.setTest = function(conditionId,testId,field,op,value,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;
        if(source.tags.type !== 'rule'){
            throw new Error("Trying to set test on a non-rule node");
        }
        if(source.conditions[conditionId] === undefined || source.conditions[conditionId].constantTests[testId] === undefined){
            throw new Error("trying to set non-existent test");
        }
        var test = this.allNodes[testId];
        test.values.field = field;
        test.values.operator = op;
        test.values.value = value;
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
        delete this.allNodes[id];
    };

    /**
       @class CompleteShell
       @method rm
       @purpose remove a node link from the cwd
       @param nodeToDelete The node object to remove from the cwd
     */
    CompleteShell.prototype.rm = function(nodeToDelete,target,sourceId){
        if(target === undefined) target = 'parents';
        var source = sourceId ? this.getNode(sourceId) : this.cwd;
        var removedNode = null;
        if(!isNaN(Number(nodeToDelete))){
            //delete numeric id node
            removedNode = this.removeNumericId(Number(nodeToDelete),target,source);
            if(!removedNode){
                removedNode = this.removeNumericId(Number(nodeToDelete),'children',source);
            }
        }else{
            throw new Error("Removing a node requires an id");
        }

        if(removedNode){
            this.cleanupNode(removedNode,source);
        }
    };

    /**
       @class CompleteShell
       @method removeNumericId
       @param id
       @param target
       @TODO check this
     */
    CompleteShell.prototype.removeNumericId = function(id,target,source){
        var removedNode = null;
        if(source[target][id] !== undefined){
            removedNode = this.allNodes[id];
            delete source[target][id];
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
    CompleteShell.prototype.removeAction = function(actionId,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;
        if(source.actions[actionId] === undefined){
            throw new Error("Can't delete a non-existent action");
        }
        //remove from the rule
        delete source.actions[actionId];
        //remove from allnodes
    };

    /**
       @class CompleteShell
       @method removeCondition
       @purpose remove a condition, and its tests, from a rule
     */
    CompleteShell.prototype.removeCondition = function(condId,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;        
        if(source.conditions[condId] === undefined){
            throw new Error("Can't delete an non-existent condition");
        }
        delete source.conditions[condId];
    };

    /**
       @class CompleteShell
       @method removeTest
       @purpose remove a test from a condition
       @param condNum
       @param testNum
     */
    CompleteShell.prototype.removeTest = function(condId,testId,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;
        console.log("removing:",condId,testId,source);
        if(source.conditions[condId] === undefined ||
           this.allNodes[condId] === undefined ||
           this.allNodes[condId].constantTests[testId] === undefined){
            throw new Error("can't delete a non-existent test");
        }
        var condition = this.allNodes[condId];
        if(condition.constantTests[testId] !== undefined){
            delete condition.constantTests[testId];
        }
        //this.cwd.conditions[condNum].constantTests.splice(testNum,1);        
    };

    /**
       @method removeBinding
       @param conditionNumber
       @param boundVar
     */
    CompleteShell.prototype.removeBinding = function(condId,boundVar,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;
        console.log("removing binding:",condId,boundVar);
        if(source.conditions[condId] === undefined || this.allNodes[condId] === undefined){
            throw new Error("can't delete from a non-existing condition");
        }
        var condition = this.allNodes[condId];
        if(condition.bindings[boundVar] !== undefined){
            delete condition.bindings[boundVar];
        }else{
            console.warn("Could not find binding:",boundVar,condition);
        }
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
        this.reteNet = new Rete.ReteNet();
    };

    /**
       @class CompleteShell
       @method clearActivatedRules
       @purpose Clear the record of recently activated rules
     */
    CompleteShell.prototype.clearActivatedRules = function(){
        Rete.clearActivations(this.reteNet);
    };
    

    /**
       @class CompleteShell
       @method compileRete
       @purpose Retrieve all defined rules, add them to the rete net
     */    
    CompleteShell.prototype.compileRete = function(nodeIds){
        //take all defined rules
        if(nodeIds === undefined) nodeIds = _.keys(this.allNodes);
        var shellRef = this,
            nodes  = nodeIds.map(function(d){
                return shellRef.getNode(d);
            }),
            rules = nodes.filter(function(d){
                return d.tags.type === 'rule';
            });
        
        console.log("Compiling rules:",rules);
        //and add them to the rete net
        //returning the action nodes of the net
        this.allActionNodes = rules.map(function(d){
            console.log("Adding rule:",d);
            var actions = Rete.addRule(d,this.reteNet,this.allNodes);
            //TODO: store the returned node inside the shell's nodes?
            return {"rule": d, "actions" :actions};
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
    CompleteShell.prototype.assertWMEs = function(nodeIds){
        //get all the wmes
        if(nodeIds === undefined) nodeIds = _.keys(this.allNodes);
        var shellRef = this,
            nodes = nodeIds.map(function(d){
                return shellRef.getNode(d);
            }),
            wmes = nodes.filter(function(node){
                return node.tags.wme !== undefined;
            });
        

        //assert them
        this.assertWMEList(wmes);
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
        //create wme objects out of them
        var newWMEs = array.map(function(data){
            var wmeId = Rete.addWME(data,this.reteNet);
            data.wmeId = wmeId;
            return wmeId;
        },this);
        console.log("New WMES:",newWMEs);
        return newWMEs;
    };

    CompleteShell.prototype.stepTime = function(){
        //console.log(this.reteNet);
        Rete.incrementTime(this.reteNet);
        console.log("Events:",this.reteNet.lastActivatedRules);
        return this.reteNet.lastActivatedRules;
    };
    
    /**
       @class CompleteShell
       @method getNode
       @purpose get a node by its id, utility method
     */
    CompleteShell.prototype.getNode = function(nodeId){
        if(this.allNodes[nodeId]){
            return this.allNodes[nodeId];
        }else{
            throw new Error("Unknown node specified: " + nodeId);
        }        
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
                return this.getNode(d);
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
    CompleteShell.prototype.nodeToShortString = function(node){
        console.log("NTSS:",node);
        if(node.tags.type === "action"){
            return "(" + node.id + "): " + node.name;
        }else if(node.tags.type === "aggregate"){
            return "Group of: " + node.noOfValues;            
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

        var additional = ["","| All Keys::|"].concat(_.keys(node).map(function(d){
            if(typeof node[d] !== 'object'){
                return d + ": " + node[d];
            }else{
                return d + ": Object size: " + _.keys(node[d]).length;
            }
        }));

        var finalArrays = _.flatten(allArrays.concat(additional));
        
        return finalArrays;
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
        throw new Error("Unimplemented: pwd");
    };

    //------------------------------
    // SEARCH method prototype
    //------------------------------
     //eg: search name root
    //    search tags type
    //    search tags type GraphNode
    //    search children 0
    //    search children blah

    CompleteShell.prototype.searchForFieldTagValue = function(values,nodeSelection){
        var field = values.shift(),
            tag = values.shift(),
            tagValue = values.shift(),
            pattern = new RegExp(tag);
        if(nodeSelection === undefined){
            nodeSelection = _.values(this.allNodes);
        }

        
        if(field === undefined || tag === undefined){
            this.lastSearchResults = [];
        }

        
        var nodes = nodeSelection.filter(function(node){
            if(node[field] === undefined) return false;
            //if field is a string
            if(typeof node[field] !== "object"){
                //using default pattern of tag
                if(pattern.test(node[field])){
                    return true;
                }else{
                    return false;
                }
            }
            //if field is an object
            if(node[field][tag] !== undefined){
                if(tagValue === undefined){
                    return true;
                }else{
                    pattern = new RegExp(tagValue);
                    if(pattern.test(node[field][tag])){
                        return true;
                    }else{
                        return false;
                    }
                }
            }
            return false;
        });
        this.lastSearchResults = nodes;
        return this.lastSearchResults;
    };

    CompleteShell.prototype.searchComparatively = function(values,nodeSelection){
        //TODO
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
            this.cdNode(target);
    };

    /**
       @class CompleteShell
       @method cdNode
       @utility
       @purpose to move about normally, dealing with nodes
       @param target
     */
    CompleteShell.prototype.cdNode = function(target){
        //update where you were previously
        this.previousLocation = this.cwd.id;
        //go up to parent
        if(target === ".."){
            console.log("cd : ..");
            if(this.cwd._originalParent){
                this.cdNode(this.cwd._originalParent);
            }else{
                //if no original parent defined
                var randomParentKey = util.randomChoice(Object.keys(this.cwd.parents));
                if(randomParentKey !== undefined){
                    this.cdNode(randomParentKey);
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
    

    //------------------------------
    //Prototype extraction:

    /**
       @method extractFactPrototypes
       @purpose to extract the prototypes of facts in rules, for comparison to existing prototypes
       @TODO currently filtering out NCCConditions, and retractions
    */
    CompleteShell.prototype.extractFactPrototypes = function(){
        this.allRules = _.values(this.allNodes).filter(function(d){
            return d.tags.type === "rule";
        });
        
        //all constantTestPrototypes:
        var constTestPrototypes = _.flatten(this.allRules.map(function(rule){ //for all rules
            return rule.conditions.filter(function(cond){ //get all positive conditions
                return cond.isNCCCondition === undefined;
            }).map(function(cond){ //create an object from the tests of each condition
                return cond.constantTests.reduce(function(memo,currTest){
                    memo[currTest.field] = currTest.value;
                    return memo;
                },{});
            });
        }));

        //TODO: fold individual prototypes into same objects with lists of possible values
        var combinedPrototypes = constTestPrototypes.reduce(function(obj){

        },{});
       
        console.log("Inferred Test Prototypes:",constTestPrototypes);
        //Combine together:
        return {
            "testPrototypes":constTestPrototypes,
        };
    };

    //--------------------
    //DFS and BFS searches:
    //--------------------

    /**
       @class CompleteShell
       @method dfs
       @purpose Depth First Search from a source nodeId,
       using children in the specified fields, filtered afterwards by a criteria function
     */
    CompleteShell.prototype.dfs = function(nodeId,focusFields,criteriaFunction){
        if(focusFields === undefined) focusFields = ['children'];
        var shellRef = this,
            currentStack = [this.getNode(nodeId)],
            visitedListOfIds = [];
        
        //discover all applicable nodes
        while(currentStack.length > 0){
            var curr = currentStack.pop();
            //avoid duplicates and loops
            if(visitedListOfIds.indexOf(curr.id) !== -1) continue;
            //store
            visitedListOfIds.push(curr.id);
            //add children to search
            focusFields.forEach(function(focusField){
                currentStack = currentStack.concat(_.keys(curr[focusField]).map(function(d){
                    return shellRef.getNode(d);
                }).reverse());
            });
        }

        //apply the criteria function to the discovered nodes
        if(criteriaFunction !== undefined && typeof criteriaFunction === 'function'){
            return visitedListOfIds.filter(function(d){
                return criteriaFunction(this.getNode(d));
            },shellRef);
        }else{
            return visitedListOfIds;
        }        
    };

    /**
       @class TotalShell
       @method bfs
       @purpose Breadth First Search on a source nodeId, for the specified fields
       filtering by the criteria, and to a specified depth
     */
    CompleteShell.prototype.bfs = function(nodeId,focusFields,criteriaFunction,depth){
        if(focusFields === undefined) focusFields = ['children'];
        if(depth === undefined) depth = 2;
        var shellRef = this,
            currentQueue = [this.getNode(nodeId)],
            visitedListOfIds = [];

        while(currentQueue.length > 0){
            var curr = currentQueue.shift();
            //skip duplicates
            if(visitedListOfIds.indexOf(curr.id) !== -1) continue;
            visitedListOfIds.push(curr.id);
            
            focusFields.forEach(function(focusField){
                _.keys(curr[focusField]).forEach(function(d){
                    currentQueue.push(shellRef.getNode(d));
                });
            });
        }
        
        if(criteriaFunction !== undefined && typeof criteriaFunction === 'function'){
            return visitedListOfIds.filter(function(d){
                return criteriaFunction(this.getNode(d));
            },shellRef);
        }else{
            return visitedListOfIds;
        }
    };
    
    
    /**
       @interface The interface of the TotalShell file
       @exports CompleteShell 
       @alias Shell for CompleteShell
     */
    var moduleInterface = {
        "CompleteShell": CompleteShell,
        "shell"        : CompleteShell,
    };
    return moduleInterface;
});
