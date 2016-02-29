if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}
/**
   @module ShellModules/shell_graph_search
*/
define(['underscore'],function(_){
    "use strict";
    /**
       @alias module:ShellModules/shell_graph_search
     */
    var ShellPrototype = {};
    //--------------------
    //DFS and BFS searches:
    //--------------------

    /**
       Depth First Search from a source nodeId,
       using children in the specified fields, filtered afterwards by a criteria function
       @method dfs
       @return ids of nodes found
     */
    ShellPrototype.dfs = function(nodeId,focusFields,criteriaFunction){
        if(focusFields === undefined) { focusFields = ['children']; }
        var shellRef = this,
            currentStack = [this.getNode(nodeId)],
            visitedListOfIds = [];
        
        //discover all applicable nodes
        while(currentStack.length > 0){
            var curr = currentStack.pop();
            //avoid duplicates and loops
            if(visitedListOfIds.indexOf(curr.id) !== -1) { continue; }
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
       Breadth First Search on a source nodeId, for the specified fields
       filtering by the criteria, and to a specified depth
       @method bfs
    */
       
    ShellPrototype.bfs = function(nodeId,focusFields,criteriaFunction,depth){
        if(focusFields === undefined) { focusFields = ['children']; }
        if(depth === undefined) { depth = 2; }
        var shellRef = this,
            currentQueue = [this.getNode(nodeId)],
            visitedListOfIds = [];

        while(currentQueue.length > 0){
            var curr = currentQueue.shift();
            //skip duplicates
            if(visitedListOfIds.indexOf(curr.id) !== -1) { continue; }
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
    
    return ShellPrototype;
});
