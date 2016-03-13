if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}


define(['underscore','../Node/Constructors','Rete'],function(_,getCtor,Rete){
    "use strict";
    /**
       Defines prototype methods for shell node creation
       @exports ShellModules/shell_node_addition
     */
    var ShellPrototype = {};

    /**
       Add an ID number and name to a field of an object
       @method
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
       Create a new node, and link it to the cwd of the shell
       @method
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
        if(source[target] === undefined){ 
            console.warn("Creating target: ",target,source);
            source[target] = {};
        }
        type = type || "GraphNode";

        //Get the constructor
        var ctor = getCtor(type),
            newNode;
        
        if(target === 'parents' || target === 'parent'){
            //if adding to parents,don't store the cwd as newnode's parent
            newNode = new ctor(name,undefined,type);
            //add the cwd to the newNodes children:
            this.addLink(newNode,'children',source.id,source.name);
            //newNode.children[this.cwd.id] = true;
        }else{
            newNode = new ctor(name,source,type);
        }

        //add to cwd:
        //console.log("Linking new node:",newNode);
        this.addLink(source,target,newNode.id,newNode.name);

        //Store in allNodes:
        if(this.allNodes[newNode.id] !== undefined){
            console.warn("Assigning to existing node:",newNode,this.allNodes[newNode.id]);
        }
        this.allNodes[newNode.id] = newNode;

        //get all subrelation objects:
        var relationObjects = newNode.getRelationObjects();
        while(relationObjects.length > 0){
            //get an object off
            var obj = relationObjects.shift();
            //get any sub objects and add them to the list
            relationObjects = relationObjects.concat(obj.getRelationObjects());
            //add the obj to allNodes
            this.allNodes[obj.id] = obj;
        }
        
        return newNode;        
    };

    /**
       Add a constant test to a specified condition of the current rule
       @method 
       @param conditionNumber The position in the condition array to add the test to
       @param testField the wme field to test
       @param op The operator to use in the test
       @param value The constant value to test against
     */
    ShellPrototype.addTest = function(conditionId,testParams,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;
        console.log("Adding test:",conditionId,testParams,source.conditions);
        //check you're in a rule
        if(source.tags.type !== 'rule' && (source.tags.type !== 'condition' || source.tags.conditionType !== 'negConjCondition')){
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
        if(this.reteNet.ComparisonOperators[testParams[1]] === undefined){
            throw new Error("Unrecognised operator");
        }
        var condition = this.allNodes[conditionId];
        //Create the test
        condition.setTest(undefined,testParams[0],testParams[1],testParams[2]);
    };

    /**
       Copy a source node to be a new child of the target
       @param sourceNodeId the id of the node to copy
       @param targetNodeId the id of the node to copy to
       @param deepOrNot whether to dfs the source node
    */
    ShellPrototype.copyNode = function(sourceNodeId,targetNodeId,deepOrNot){
        var sourceNode = this.getNode(sourceNodeId),
            targetNode = this.getNode(targetNodeId);
        if(sourceNode === undefined || targetNode === undefined){
            throw new Error("Unrecognised source or target for copy");
        }
        //create a dummy node for a new id
        var graphNodeCtor = this.getCtor(),
            dummyNode = new graphNodeCtor("dummy",undefined,"dummy",{}),
            //get the ctor for the source node:
            ctor = this.getCtor(sourceNode.tags.type),
            //create the new node
            newNode = _.create(ctor.prototype,JSON.parse(JSON.stringify(sourceNode)));
        //set a new id:
        newNode.id = dummyNode.id;

        //add it to the allNodes list:
        this.allNodes[newNode.id] = newNode;

        //add it to the targetNode
        targetNode.addRelation('child',newNode);
        
    };
    

    return ShellPrototype;
});
