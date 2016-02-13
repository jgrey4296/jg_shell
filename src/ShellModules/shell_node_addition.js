/**
   @purpose Defines prototype methods for shell node creation
 */
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}


define(['underscore','../Node/GraphNode','../Node/GraphStructureConstructors','../Rete/ReteInterface'],function(_,GraphNode,DSCtors,Rete){
    "use strict";
    var ShellPrototype = {};

        /**
       @class CompleteShell
       @method addLink
       @purpose Add an ID number and name to a field of an object
       @param node the node to add the link FROM
       @param target the field of the node to link FROM
       @param id the id of the node to link TO
       @param name the name of the node to link TO
    */
    ShellPrototype.addLink = function(node,target,id,name){
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
    ShellPrototype.addNode = function(name,target,type,values,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;
        
        if(name === null || name === undefined || name === "") {
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
    ShellPrototype.addTest = function(conditionId,testParams,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;
        console.log("Adding test:",conditionId,testParams,source.conditions);
        //check you're in a rule
        if(source.tags.type !== 'rule' && source.tags.type !== 'negConjCondition'){
            throw new Error("Trying to modify a rule when not located at a rule");
        }
        //check the specified condition exists
        if(source.conditions[conditionId] === undefined || this.allNodes[conditionId] === undefined){
            console.log(conditionId,source.conditions);
            throw new Error("Can't add a test to a non-existent condition");
        }
        if(testParams.length !== 3){
            throw new Error("Insufficient test specification");
        }
        //Check the operator is a defined one
        if(Rete.CompOperators[testParams[1]] === undefined){
            throw new Error("Unrecognised operator");
        }
        var condition = this.allNodes[conditionId];
        //Create the test
        condition.constantTests.push({
            field: testParams[0],
            operator: testParams[1],
            value: testParams[2]
        });
    };

    /**
       @class CompleteShell
       @method addAction
       @purpose add a new action to current rule
       @param valueArray The names of actions to create
       @return newActions an array of all actions created
    */
    ShellPrototype.addAction = function(valueArray,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;
        if(source.tags.type !== 'rule'){
            throw new Error("Trying to modify a rule when not located at a rule");
        }
        var name = valueArray.shift() || "anonAction";
        
        //add an action node to cwd.actions
        var newAction = this.addNode(name,'actions','action',valueArray,sourceId);
        return newAction;
    };


    return ShellPrototype;
});
