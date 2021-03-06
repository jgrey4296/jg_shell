import _ from 'lodash';

/**
   @module ShellModules/shell_graph_search
*/
/**
   @alias module:ShellModules/shell_graph_search
*/
let ShellPrototype = {};
//--------------------
//DFS and BFS searches:
//--------------------

/**
   Depth First Search from a source nodeId,
   using children in the specified fields, filtered afterwards by a criteria function
   @method dfs
   @param nodeId
   @param focusFields : IF undefined, will get all linked nodes
   @param criteriaFunction
   @return ids of nodes found
*/
ShellPrototype.dfs = function(nodeId,focusFields,criteriaFunction){
    let shellRef = this,
        currentStack = [this.getNode(nodeId)],
        visitedIds = new Set();
    
    //discover all applicable nodes
    while (currentStack.length > 0){
        let curr = currentStack.pop();
        //avoid duplicates and loops
        if (visitedIds.has(curr.id)) { continue ; }
        visitedIds.add(curr.id);
        //add children to search
        currentStack = currentStack.concat(curr.getActiveLinks(focusFields).map(d=>shellRef.getNode(d)).reverse());
    }

    //apply the criteria function to the discovered nodes
    if (criteriaFunction !== undefined && typeof criteriaFunction === 'function'){
        return Array.from(visitedIds).filter(d=>criteriaFunction(shellRef.getNode(d)));
    }
    return Array.from(visitedIds);
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
    if (depth === undefined) { depth = 2; }
    let shellRef = this,
        currentQueue = [this.getNode(nodeId)],
        visitedIds = new Set();

    while (currentQueue.length > 0){
        let curr = currentQueue.shift();
        //skip duplicates
        if (visitedIds.has(curr.id)){ continue; }
        visitedIds.add(curr.id);
        currentQueue = currentQueue.concat(curr.getActiveLinks(focusFields).map(d=>shellRef.getNode(d)));
    }
    
    if (criteriaFunction !== undefined && typeof criteriaFunction === 'function'){
        return Array.from(visitedIds).filter(d=>criteriaFunction(shellRef.getNode(d)));
    }
    return Array.from(visitedIds);
};

/**
   Get Bindings for conditions and condition rules.
   @param rule
   @returns {Array} A List of all binding variables from all conditions and rules
*/
ShellPrototype.getConditionBindings = function(rule){
    if (rule.linkedNodes === undefined){
        throw new Error("Invalid object passed to getConditionBindings");
    }
    //Add a 'Bindings' field to the drawn rule, of all conditions (and rules conditions) bindings
    //1)get initial conditions:
    let initialList = _.toPairs(rule.linkedNodes).filter(d=>/condition|rule/.test(d[1])).map(d=>this.getNode(d[0])),
        foundSet = new Set(initialList.map(d=>d.id)),
        //split into rules and conditions:
        rules = _.filter(initialList,d=>d instanceof this.getCtor('rule')),
        conditions = _.reject(initialList,d=>d instanceof this.getCtor('rule'));

    //Get all conditions, even of rules
    while (rules.length > 0){
        let currRule = rules.shift(),
            ruleConditions = _.toPairs(currRule.linkedNodes).filter(d=>/condition/.test(d[1])).map(d=>this.getNode(d[0]));
        //record the action has been found:
        foundSet.add(currRule.id);
        ruleConditions.forEach(function(d){
            if (!foundSet.has(d.id) && d instanceof this.getCtor('condition')){
                conditions.push(d);
                foundSet.add(d.id);
            } else if (!foundSet.has(d.id) && d instanceof this.getCtor('rule')){
                rules.push(d);
                foundSet.add(d.id);
            }
        },this);
    }

    //Get the bindings for all the conditions:
    let allBindings = Array.from(new Set(_.flatten(conditions.map(d=>_.keys(d.bindings)))));
    return allBindings;
};


/**
   Get the bindings for all actions
   @param rule
*/
ShellPrototype.getActionBindings = function(inputRule){
    let initialList = _.toPairs(inputRule.linkedNodes).filter(d=>/action/.test(d[1])).map(d=>this.getNode(d[0])),
        foundSet = new Set(initialList.map(d=>d.id)),
        rules = _.filter(initialList,d=>d instanceof this.getCtor('rule')),
        actions = _.reject(initialList,d=>d instanceof this.getCtor('rule'));

    while (rules.length > 0){
        let currRule = rules.shift(),
            ruleActions = _.toPairs(currRule.linkedNodes).filter(d=>/action/.test(d[1])).map(d=>this.getNode(d[0]));
        foundSet.add(currRule.id);
        ruleActions.forEach(function(d){
            if (!foundSet.has(d.id) && d instanceof this.getCtor('action')){
                actions.push(d);
                foundSet.add(d.id);
            } else if (!foundSet.has(d.id) && d instanceof this.getCtor('rule')){
                rules.push(d);
                foundSet.add(d.id);
            }
        },this);

    }

    //get all the binding names from all values in the action:
    let allValues = _.flatten(actions.map(d=>_.values(d.values))),
        varRegex = /\${(\w+)}/g,
        extractedVarNames = new Set();

    allValues.forEach((d) => {
        let vMatch = varRegex.exec(d);
        while (vMatch !== null){
            extractedVarNames.add(vMatch[1]);
            vMatch = varRegex.exec(d);
        }
    });
    
    return Array.from(extractedVarNames);
};

export { ShellPrototype as shellGraphSearch };

