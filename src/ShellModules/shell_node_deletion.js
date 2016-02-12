/**
   @purpose Defines Shell prototype methods for deleting nodes
 */
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}


define(['underscore'],function(_){
    var ShellPrototype = {};

        /**
       @class CompleteShell
       @method deleteNode
       @purpose remove a node from the list of all nodes
       @param id The id of the node to remove
     */
    ShellPrototype.deleteNode = function(id){
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
    ShellPrototype.rm = function(nodeToDelete,target,sourceId){
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
            //TODO
            //this.cleanupNode(removedNode,source);
            //delete this.allNodes[Number(nodeToDelete)];
        }
    };

    /**
       @class CompleteShell
       @method removeNumericId
       @param id
       @param target
       @TODO check this
     */
    ShellPrototype.removeNumericId = function(id,target,source){
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
    ShellPrototype.cleanupNode = function(node,owningNode){
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
    ShellPrototype.removeAction = function(actionId,sourceId){
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
    ShellPrototype.removeCondition = function(condId,sourceId){
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
    ShellPrototype.removeTest = function(condId,testId,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;
        
        if(source.conditions[condId] === undefined ||
           this.allNodes[condId] === undefined ||
           this.allNodes[condId].constantTests[testId] === undefined){
            throw new Error("can't delete a non-existent test");
        }
        var condition = this.allNodes[condId];
        if(condition.constantTests[testId] !== undefined){
            condition.constantTests.splice(testId,1);
        }
    };

    /**
       @method removeBinding
       @param conditionNumber
       @param boundVar
     */
    ShellPrototype.removeBinding = function(condId,boundVar,sourceId){
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


    return ShellPrototype;
});
