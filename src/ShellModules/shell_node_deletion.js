if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}


define(['underscore'],function(_){
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
        delete this.allNodes[id];
    };

    /**
       Remove a node link from the cwd
       @method
       @param nodeToDelete The node object to remove from the cwd
       @param target
       @param sourceId
     */
    ShellPrototype.rm = function(nodeToDelete,target,sourceId){
        if(target === undefined) { target = 'parents'; }
        let source = sourceId ? this.getNode(sourceId) : this.cwd,
            removedNode = null;
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
            //TODO
            //this.cleanupNode(removedNode,source);
            //delete this.allNodes[Number(nodeToDelete)];
        }
    };

    /**
       Removes by id
       @method
       @param id
       @param target
       @TODO check this
     */
    ShellPrototype.removeNumericId = function(id,target,source){
        let removedNode = null;
        if(source.linkedNodes[target][id] !== undefined){
            removedNode = this.allNodes[id];
            delete source.linkedNodes[target][id];
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
        if(source.linkedNodes.actions[actionId] === undefined){
            throw new Error("Can't delete a non-existent action");
        }
        //remove from the rule
        delete source.linkedNodes.actions[actionId];
        //remove from allnodes
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
        let condition = this.allNodes[condId];
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
        if(source.linkedNodes.conditions[condId] === undefined || this.allNodes[condId] === undefined){
            throw new Error("can't delete from a non-existing condition");
        }
        let condition = this.allNodes[condId];
        if(condition.bindings[boundVar] !== undefined){
            delete condition.bindings[boundVar];
        }else{
            console.warn("Could not find binding:",boundVar,condition);
        }
    };


    return ShellPrototype;
});
