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
    CompleteShell.prototype.addNode = function(name,target,type,values){
        if(name === null) {
            name = type || "anon";
            console.warn("making an anonymous node");
        }
        //validate input:
        if(this.cwd[target] === undefined){ //throw new Error("Unknown target");
            console.warn("Creating target: ",target,this.cwd);
            this.cwd[target] = {};
        }
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
            var newChildren = DSCtors[type](newNode,values);
            if(newChildren && newChildren.length > 0){
                var flatChildren = _.flatten(newChildren);
                flatChildren.forEach(function(d){
                    if(this.allNodes[d.id] !== undefined){
                        console.warn("Assigning to existing node:",d,this.allNodes[d.id]);
                    }
                    this.allNodes[d.id] = d;
                },this);
            }
        }else if(type !== 'GraphNode' && type !== 'node'){
            console.warn("No ctor for:",type);
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
       @method addTest
       @purpose Add a constant test to a specified condition of the current rule
       @param conditionNumber The position in the condition array to add the test to
       @param testField the wme field to test
       @param op The operator to use in the test
       @param value The constant value to test against
     */
    CompleteShell.prototype.addTest = function(conditionId,testParams){
        console.log("Adding test:",conditionId,testParams,this.cwd.conditions);
        //check you're in a rule
        if(this.cwd.tags.type !== 'rule'){
            throw new Error("Trying to modify a rule when not located at a rule");
        }
        //check the specified condition exists
        if(this.cwd.conditions[conditionId] === undefined
          || this.allNodes[conditionId] === undefined){
            console.log(conditionId,this.cwd.conditions);
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
        if(DSCtors['test'] === undefined) throw new Error("No ctor for test");
        DSCtors['test'](test,testParams);
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
        var name = valueArray.shift() || "anonAction";
        
        //add an action node to cwd.actions
        var newAction = this.addNode(name,'actions','action',valueArray);
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
    CompleteShell.prototype.setBinding = function(conditionId,toVar,fromVar){
        console.log("Add binding to:",conditionId,toVar,fromVar);
        if(this.cwd.tags.type !== 'rule'){
            throw new Error("Trying to modify a rule when not located at a rule");
        }
        if(this.cwd.conditions[conditionId] === undefined){
            throw new Error("Can't add binding to non=existent condition");
        }
        var condition = this.allNodes[conditionId];
        //condition.bindings.push([toVar,fromVar]);
        condition.bindings[toVar] = fromVar;
        console.log(this.cwd.conditions[conditionId].bindings);
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
    CompleteShell.prototype.setArithmetic = function(actionId,varName,op,value){
        console.log("Setting arithmetic of:",actionId,varName,op,value);
        console.log(_.keys(this.cwd.actions));
        if(this.cwd.tags.type !== 'rule'){
            throw new Error("Arithmetic can only be applied to actions of rules");
        }
        if(this.cwd.actions[actionId] === undefined){
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
    CompleteShell.prototype.setActionValue = function(actionId,a,b){
        if(this.cwd.tags.type !== 'rule'){
            throw new Error("Can't set action values on non-actions");
        }
        if(this.cwd.actions[actionId] !== undefined){
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
    CompleteShell.prototype.setActionType = function(actionId,a){
        if(this.cwd.tags.type !== 'rule'){
            throw new Error("Can't set action type for non-rules");
        }
        if(this.cwd.actions[actionId] !== undefined){
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
    CompleteShell.prototype.setTest = function(conditionId,testId,field,op,val){
        if(this.cwd.tags.type !== 'rule'){
            throw new Error("Trying to set test on a non-rule node");
        }
        if(this.cwd.conditions[conditionId] === undefined || this.cwd.conditions[conditionId].constantTests[testId] === undefined){
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
        delete this.allNodes(id);
    };

    /**
       @class CompleteShell
       @method rm
       @purpose remove a node link from the cwd
       @param nodeToDelete The node object to remove from the cwd
     */
    CompleteShell.prototype.rm = function(nodeToDelete,target){
        if(target === undefined) target = 'parents';
        var removedNode = null;
        if(!isNaN(Number(nodeToDelete))){
            //delete numeric id node
            removedNode = this.removeNumericId(Number(nodeToDelete),target);
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
    CompleteShell.prototype.removeAction = function(actionId){
        if(this.cwd.actions[actionId] === undefined){
            throw new Error("Can't delete a non-existent action");
        }
        //remove from the rule
        delete this.cwd.actions[actionId];
        //remove from allnodes
    };

    /**
       @class CompleteShell
       @method removeCondition
       @purpose remove a condition, and its tests, from a rule
     */
    CompleteShell.prototype.removeCondition = function(condId){
        if(this.cwd.conditions[condId] === undefined){
            throw new Error("Can't delete an non-existent condition");
        }
        delete this.cwd.conditions[condId];
    };

    /**
       @class CompleteShell
       @method removeTest
       @purpose remove a test from a condition
       @param condNum
       @param testNum
     */
    CompleteShell.prototype.removeTest = function(condId,testId){
        console.log("removing:",condId,testId,this.cwd);
        if(this.cwd.conditions[condId] === undefined ||
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
    CompleteShell.prototype.removeBinding = function(condId,boundVar){
        console.log("removing binding:",condId,boundVar);
        if(this.cwd.conditions[condId] === undefined
          || this.allNodes[condId] === undefined){
            throw new Error("can't delete from a non-existing condition");
        }
        var condition = this.allNodes[condId];
        if(condition.bindings[boundVar] !== undefined){
            delete condition.bindings[boundVar];
        }else{
            console.warn("Could not find binding:",boundVar,condition);
        }
    }
    
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
    CompleteShell.prototype.compileRete = function(){
        //take all defined rules
        //TODO: make this all rules that are descendents of the current node?
        var rules = _.values(this.allNodes).filter(function(d){
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
    CompleteShell.prototype.assertWMEs = function(){
        //get all the wmes
        var wmes = _.values(this.allNodes).map(function(node){
            if(node.tags.wme !== undefined){
                return node;
            }
        },this).filter(function(d){ return d !== undefined && d.wmeId === undefined; });

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
        console.log(this.reteNet);
        Rete.incrementTime(this.reteNet);
        console.log("Events:",this.reteNet.lastActivatedRules);
        return this.reteNet.lastActivatedRules;
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


    //eg: search name root
    //    search tags type
    //    search tags type GraphNode
    //    search children 0
    //    search children blah

    CompleteShell.prototype.searchForFieldTagValue = function(values,nodeSelection){
        var field = values.shift();
        var tag = values.shift();
        var tagValue = values.shift();
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
                var pattern = new RegExp(tag);
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
                    var pattern = new RegExp(tagValue);
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
        this.previousLocation = this.cwd.id;
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
            return (rule.conditions.filter(function(cond){ //get all positive conditions
                return cond.isNCCCondition === undefined;
            }).map(function(cond){ //create an object from the tests of each condition
                return cond.constantTests.reduce(function(memo,currTest){
                    memo[currTest.field] = currTest.value;
                    return memo;
                },{});
            }));
        }));

        //TODO: fold individual prototypes into same objects with lists of possible values
        var combinedPrototypes = constTestPRototypes.reduce(function(obj){

        },{});

        
       
        console.log("Inferred Test Prototypes:",constTestPrototypes);

        
        //Combine together:
        return {
            "testPrototypes":constTestPrototypes,
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
