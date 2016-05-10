if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}


define(['lodash'],function(_){
    "use strict";
    /**
     Defines Shell prototype methods for deleting nodes
     @exports ShellModules/shell_node_deletion
     */
    var ShellPrototype = {};

    /**
       Remove a node from the list of all nodes
       @method
       @param id The id of the node to remove
     */
    ShellPrototype.deleteNode = function(id){
        if(this.allNodes[id] === undefined){
            throw new Error("unrecognised node to delete");
        }
        //todo remove all reciprocal links
        let nodeToDelete = this.getNode(id);
        //cleanup all connections to the nodes
        _.keys(nodeToDelete.linkedNodes).forEach(d=>this.rm(id,undefined,d));
        //actually delete the node
        delete this.allNodes[id];
    };

    /**
       Remove a node link from the cwd
       @method
       @param nodeToDelete The node object to remove from the cwd
       @param target @deprecated
       @param sourceId
     */
    ShellPrototype.rm = function(nodeToDelete,target,sourceId){
        let source = sourceId ? this.getNode(sourceId) : this.cwd,
            removedNode = null;
        if(!isNaN(Number(nodeToDelete))){
            //delete numeric id node
            removedNode = this.removeNumericIdLink(Number(nodeToDelete),source);
        }else{
            console.log(nodeToDelete);
            throw new Error("Removing a node requires an id");
        }

        if(removedNode && _.keys(removedNode.linkedNodes).length === 0){
            this.deleteNode(removedNode.id);
        }
    };

    /**
       remove a link from the provided node
       @method
       @param id
       @TODO check this: should remove an annotation of a link, when nodes can be linked multiple times in a single node?
     */
    ShellPrototype.removeNumericIdLink = function(id,source){
        let removedNode = this.getNode(id);
        if(source && source.linkedNodes[id] !== undefined && removedNode && removedNode.linkedNodes[source.id] ){
            delete source.linkedNodes[id];
            delete removedNode.linkedNodes[source.id];
        }
        return removedNode;
    };

    /**
       To link a node to the disconnected nodes if it no longer has active links
       @method
       @param node
       @param owningNode
     */
    ShellPrototype.cleanupNode = function(node,owningNode){
        //remove the owning node from any link in the node:
        if(node.linkedNodes.parents && node.linkedNodes.parents[owningNode.id]){
            delete node.linkedNodes.parents[owningNode.id];
        }
        if(node.linkedNodes.children && node.linkedNodes.children[owningNode.id]){
            delete node.linkedNodes.children[owningNode.id];
        }
    };

    /**
       Remove an action from the current rule
       @method
       @param actionId
       @param sourceId
     */
    ShellPrototype.removeAction = function(actionId,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;
        if(source.linkedNodes[actionId] === undefined){
            throw new Error("Can't delete a non-existent action");
        }
        //remove from the rule
        this.rm(actionId,undefined,source.id);
    };

    /**
       Remove a condition, and its tests, from a rule
       @method
       @param condId
       @param sourceId
     */
    ShellPrototype.removeCondition = function(condId,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;        
        if(source.linkedNodes.conditions[condId] === undefined){
            throw new Error("Can't delete an non-existent condition");
        }
        delete source.linkedNodes.conditions[condId];
    };

    /**
       Remove a test from a condition
       @method
       @param condNum
       @param testNum
     */
    ShellPrototype.removeTest = function(condId,testId,sourceId){
        let source = sourceId ? this.getNode(sourceId) : this.cwd;
        
        if(source.linkedNodes.conditions[condId] === undefined ||
           this.allNodes[condId] === undefined ||
           this.allNodes[condId].constantTests[testId] === undefined){
            throw new Error("can't delete a non-existent test");
        }
        let condition = this.getNode(condId);
        if(condition.constantTests[testId] !== undefined){
            condition.constantTests.splice(testId,1);
        }
    };

    /**
       Remove a binding from a (condition) node
       @method
       @param conditionNumber
       @param boundVar
       @param sourceId
     */
    ShellPrototype.removeBinding = function(condId,boundVar,sourceId){
        let source = sourceId ? this.getNode(sourceId) : this.cwd;
        console.log("removing binding:",condId,boundVar);
        if(source.linkedNodes[condId] === undefined || this.allNodes[condId] === undefined){
            throw new Error("can't delete from a non-existing condition");
        }
        let condition = this.getNode(condId);
        if(condition.bindings[boundVar] !== undefined){
            delete condition.bindings[boundVar];
        }else{
            console.warn("Could not find binding:",boundVar,condition);
        }
    };


    return ShellPrototype;
});
