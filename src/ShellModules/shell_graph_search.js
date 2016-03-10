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
       @param nodeId
       @param focusField
       @param criteriaFunction
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
       @param nodeId
       @param focusFields
       @param criteriaFunction
       @param depth
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

    /**
       Get Bindings for conditions and condition rules.
       @param rule
       @returns {Array} A List of all binding variables from all conditions and rules
    */
    ShellPrototype.getConditionBindings = function(rule){
        //Add a 'Bindings' field to the drawn rule, of all conditions (and rules conditions) bindings
        //1)get initial conditions:
        var initialList = _.keys(rule.conditions).map(d=>this.getNode(d)),
            foundSet = new Set(initialList.map(d=>d.id)),
            //split into rules and conditions:
            rules = _.filter(initialList,d=>d instanceof this.getCtor('rule')),
            conditions = _.reject(initialList,d=>d instanceof this.getCtor('rule'));

        //Get all conditions, even of rules
        while(rules.length > 0){
            var currRule = rules.shift(),
                ruleConditions = _.keys(currRule.conditions).map(d=>this.getNode(d));
            //record the action has been found:
            foundSet.add(currRule.id);
            ruleConditions.forEach(function(d){
                if(!foundSet.has(d.id) && d instanceof this.getCtor('condition')){
                    conditions.push(d);
                    foundSet.add(d.id);
                }else if(!foundSet.has(d.id) && d instanceof this.getCtor('rule')){
                    rules.push(d);
                    foundSet.add(d.id);
                }
            });
        }

        //Get the bindings for all the conditions:
        var allBindings = Array.from(new Set(_.flatten(conditions.map(d=>_.keys(d.bindings)))));
        return allBindings;
    };
    
    
    return ShellPrototype;
});
