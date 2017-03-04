import _ from 'lodash';
/**
   Defines shell prototype methods for changing a node
   @exports ShellModules/shell_node_mod
*/

let ShellPrototype = {};

/**
   Rename the current nodes name
   @method
   @param name The name to rename to
   @param sourceId
*/
ShellPrototype.rename = function(name,sourceId){
    let source = sourceId ? this.getNode(sourceId) : this.cwd;
    source.name = name;
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
    let source = sourceId ? this.getNode(sourceId) : this.cwd;
    console.log("Adding test:",conditionId,testParams,source.conditions);
    //check you're in a rule
    if (source.tags.type !== 'rule' && (source.tags.type !== 'condition' || source.tags.conditionType !== 'negConjCondition')){
        throw new Error("Trying to modify a rule when not located at a rule");
    }
    //check the specified condition exists
    if (source.linkedNodes[conditionId] === undefined || this.allNodes[conditionId] === undefined){
        console.log(conditionId,source.linkedNodes);
        throw new Error("Can't add a test to a non-existent condition");
    }
    if (testParams.length !== 3){
        throw new Error("Insufficient test specification");
    }
    //Check the operator is a defined one
    if (this.reteNet.ComparisonOperators[testParams[1]] === undefined){
        throw new Error("Unrecognised operator");
    }
    let condition = this.allNodes[conditionId];
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
    let sourceNode = this.getNode(sourceNodeId),
        targetNode = this.getNode(targetNodeId);
    if (sourceNode === undefined || targetNode === undefined){
        throw new Error("Unrecognised source or target for copy");
    }
    //create a dummy node for a new id
    let graphNodeCtor = this.getCtor(),
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
    this.link(newNode.id,'child','parent',targetNodeId);
    //targetNode.addRelation('child',newNode);
    
};



/**
   Set a key:value pair in the node[field] to value
   @method
   @param field
   @param parameter
   @param value
   @param sourceId
*/
ShellPrototype.setParameter = function(field,parameter,value,sourceId){
    let source = sourceId ? this.getNode(sourceId) : this.cwd;
    //if (!source[field]) throw new Error("Unrecognised field");
    //if (field !== 'values' && field !== 'tags' && field !== 'annotations'){
    //    throw new Error("Bad field");
    //}
    if (source[field] === undefined && field !== undefined){
        source[field] = {};
    }
    if (parameter === undefined && field !== 'values' && field !== 'tags' && field !== 'linkedNodes' && field !== 'name' && field !== 'id'){
        delete source[field];
    } else if (value !== undefined){
        source[field][parameter] = value;
    } else {
        //if no value is specified, remove the entry
        delete source[field][parameter];
    }
    
};


/**
   Interface method to add a link to the cwd. can be reciprocal
   @method
   @param id The id of the node being linked towards
   @param relationType
   @param reciprocalType The type of return relation between the nodes. eg: 'parent','rule'
   @param sourceId
*/
ShellPrototype.link = function(id,relationType,reciprocalType,sourceId){
    let source = sourceId ? this.getNode(sourceId) : this.cwd,
        nodeToLink = this.getNode(id);

    this.addLink(source,nodeToLink.id,relationType);
    if (typeof reciprocalType === 'string'){
        this.addLink(nodeToLink,source.id,reciprocalType);
    }
};

/**
   Add an ID number and name to a field of an object
   @method
   @param node the node to add the link FROM
   @param id the id of the node to link TO
   @param linkType the name characterising the relationship
*/
ShellPrototype.addLink = function(node,id,linkType){
    if (isNaN(Number(id))){
        throw new Error("Trying to link without providing a valid id number:" + id);
    }
    if (node && node.linkedNodes){
        node.linkedNodes[Number(id)] = linkType;
    } else {
        throw new Error("Unrecognised target");
    }
};


/**
   Set/Add a binding pair to a condition in a rule
   @method
   @param conditionNum The condition to add the binding to
   @param toVar The variable name to use as the bound name
   @param fromVar the wme field to bind
   @param sourceId
   @example toVar = wme.fromVar
*/
ShellPrototype.setBinding = function(conditionId,toVar,fromVar,testPairs,sourceId){
    let source = sourceId ? this.getNode(sourceId) : this.cwd;
    console.log("Add binding to:",conditionId,toVar,fromVar);
    if (source.tags.type !== 'rule' && (source.tags.type !== 'condition' || source.tags.conditionType !== 'negConjCondition')){
        throw new Error("Trying to modify a rule when not located at a rule or condition");
    }
    if (source.linkedNodes[conditionId] === undefined){
        throw new Error("Can't add binding to non=existent condition");
    }
    let condition = this.getNode(conditionId);
    //condition.bindings.push([toVar,fromVar]);
    condition.setBinding(toVar,fromVar,testPairs);
    console.log(condition,condition.bindings);
};

/**
   set an arithmetic operation for an action
   @method
   @param actionNum The action to add the operation to
   @param varName the variable to change
   @param op the operator to use. ie: + - * / ....
   @param value The value to apply to the varName

   @TODO allow bindings in the rhs/value field
*/
ShellPrototype.setArithmetic = function(actionId,varName,op,value,sourceId){
    let source = sourceId ? this.getNode(sourceId) : this.cwd;
    console.log("Setting arithmetic of:",actionId,varName,op,value);
    console.log(_.keys(source.linkedNodes));
    if (source.tags.type !== 'rule'){
        throw new Error("Arithmetic can only be applied to actions of rules");
    }
    if (source.linkedNodes[actionId] === undefined){
        throw new Error("Cannot add arithmetic to non-existent action");
    }
    let action = this.getNode(actionId);

    if (action === undefined){
        throw new Error("Could not find action");
    }
    action.setArith(varName,op,value);

};

/**
   Store a regex transform for an action, in a similar way to arithmetic actions
   @method
   @param actionId
   @param varName
   @param regex
   @param sourceId
*/
ShellPrototype.setRegex = function(actionId,varName,regex,sourceId){
    let source = sourceId ? this.getNode(sourceId) : this.cwd;
    console.log("Setting regex transform of:",actionId,varName,regex);
    //if it includes the opening and closing /'s, remove them?

    //get the action
    let action = this.getNode(actionId);
    action.setRegex(varName,regex);

};

/**
   Modify the timing of an {@link Action}
   @method
   @param actionId
   @param timeVar
   @param value
   @param sourceId
*/
ShellPrototype.setTiming = function(actionId,timeVar,value,sourceId){
    let source = sourceId ? this.getNode(sourceId) : this.cwd,
        action = this.getNode(actionId);
    action.setTiming(timeVar,value);

};

/**
   Set the priority of an action
   @param actionId
   @param priorityVal
*/
ShellPrototype.setPriority = function(actionId,priorityVal,sourceId){
    let source = sourceId ? this.getNode(sourceId) : this.cwd,
        action = this.getNode(actionId);
    if (isNaN(Number(priorityVal))){
        throw new Error("Priority needs to be a number");
    }
    action.setPriority(Number(priorityVal));
};

/**
   Set an internal value of an action, without going into that node itself
   @method
   @param actionNum The action to target
   @param a The parameter name
   @param b The parameter value
   @param sourceId
   @note If only a is supplied, sets the action's actionType tag
*/
ShellPrototype.setActionValue = function(actionId,a,b,sourceId){
    let source = sourceId ? this.getNode(sourceId) : this.cwd;
    if (source.tags.type !== 'rule'){
        throw new Error("Can't set action values on non-actions");
    }
    if (source.linkedNodes[actionId] !== undefined){
        let action = this.getNode(actionId);
        action.setValue(b,'values',a);
    } else {
        throw new Error("Unrecognised action");
    }
};

/**
   Set the actiontype of an (Action) node
   @method
   @param actionNum
   @param a the type
   @param sourceId
*/
ShellPrototype.setActionType = function(actionId,a,sourceId){
    let source = sourceId ? this.getNode(sourceId) : this.cwd;
    if (source.tags.type !== 'rule'){
        throw new Error("Can't set action type for non-rules");
    }
    if (source.linkedNodes[actionId] !== undefined){
        let action = this.allNodes[actionId];
        action.setValue(a,'tags','actionType');
    } else {
        throw new Error("Unrecognised action");
    }
};

/**
   Add/modify a constant test of a condition
   @method
   @param conNum the condition to target
   @param testNum the test to target
   @param field the wme field to test
   @param op The operator to test using
   @param val the value to test against
   @param sourceId
*/
ShellPrototype.setTest = function(conditionId,testId,field,op,value,sourceId){
    console.log(conditionId,testId,field,op,value,sourceId);
    let source = sourceId ? this.getNode(sourceId) : this.cwd;
    if (source.tags.type !== 'rule' && (source.tags.type !== 'condition' || source.tags.conditionType !== 'negConjCondition')){
        throw new Error("Trying to set test on a non-rule node");
    }
    if (source.linkedNodes[conditionId] === undefined || this.getNode(conditionId).constantTests[testId] === undefined){
        throw new Error("trying to set non-existent test");
    }

    let condition = this.getNode(conditionId);
    condition.setTest(testId,field,op,value);
};


export { ShellPrototype as shellMod };

