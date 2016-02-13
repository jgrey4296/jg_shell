/**
   @purpose Defines shell prototype methods for changing a node
 */
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore'],function(_){
    "use strict";
    var ShellPrototype = {};

    /**
       @class CompleteShell
       @method rename
       @purpose rename the current nodes name
       @param name The name to rename to
     */
    ShellPrototype.rename = function(name,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;
        source.name = name;
    };

    /**
       @class CompleteShell
       @method setParameter
       @purpose Set a key:value pair in the node[field] to value
       @param field
       @param parameter
       @param value
     */
    ShellPrototype.setParameter = function(field,parameter,value,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;
        //if(!source[field]) throw new Error("Unrecognised field");
        //if(field !== 'values' && field !== 'tags' && field !== 'annotations'){
        //    throw new Error("Bad field");
        //}
        if(source[field] === undefined && field !== undefined){
            source[field] = {};
        }
        if(parameter === undefined && field !== 'values' && field !== 'tags' && field !== 'children' && field !== 'parents' && field !== 'name' && field !== 'id'){
            delete source[field];
        }else if(value !== undefined){
            source[field][parameter] = value;
        }else{
            //if no value is specified, remove the entry
            delete source[field][parameter];
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
    ShellPrototype.link = function(target,id,reciprocal,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;

        //validate:
        if(isNaN(Number(id))) { throw new Error("id should be a global id number"); }
        if(this.allNodes[id] === undefined){
            throw new Error("Node for id " + id + " does not exist");
        }
        if(!source[target]) { throw new Error("Unrecognised target"); }

        //perform the link:
        var nodeToLink = this.allNodes[id];
        this.addLink(source,target,nodeToLink.id,nodeToLink.name);
        //this.cwd[target][nodeToLink.id] = true; //this.allNodes[id];
        if(reciprocal){
            var rTarget = 'parents';
            if(target === 'parents') { rTarget = 'children'; }
            this.addLink(nodeToLink,rTarget,source.id,source.name);
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
    ShellPrototype.setBinding = function(conditionId,toVar,fromVar,testPairs,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;
        console.log("Add binding to:",conditionId,toVar,fromVar);
        if(source.tags.type !== 'rule' && source.tags.type !== 'negConjCondition'){
            throw new Error("Trying to modify a rule when not located at a rule");
        }
        if(source.conditions[conditionId] === undefined){
            throw new Error("Can't add binding to non=existent condition");
        }
        var condition = this.allNodes[conditionId];
        //condition.bindings.push([toVar,fromVar]);
        condition.bindings[toVar] = [fromVar,testPairs];
        console.log(source.conditions[conditionId].bindings);
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
    ShellPrototype.setArithmetic = function(actionId,varName,op,value,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;
        console.log("Setting arithmetic of:",actionId,varName,op,value);
        console.log(_.keys(source.actions));
        if(source.tags.type !== 'rule'){
            throw new Error("Arithmetic can only be applied to actions of rules");
        }
        if(source.actions[actionId] === undefined){
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

    //Store a regex transform for an action, in a similar way to arithmetic actions
    ShellPrototype.setRegex = function(actionId,varName,regex, options, replaceValue,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;
        console.log("Setting regex transform of:",actionId,varName,regex,replaceValue);
        //if it includes the opening and closing /'s, remove them?

        //get the action
        var action = this.allNodes[actionId];

        if(regex && replaceValue){
            action.regexActions[varName] = [regex,options, replaceValue];
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
    ShellPrototype.setActionValue = function(actionId,a,b,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;
        if(source.tags.type !== 'rule'){
            throw new Error("Can't set action values on non-actions");
        }
        if(source.actions[actionId] !== undefined){
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
    ShellPrototype.setActionType = function(actionId,a,sourceId){
        var source = sourceId ? this.getNode(sourceId) : this.cwd;
        if(source.tags.type !== 'rule'){
            throw new Error("Can't set action type for non-rules");
        }
        if(source.actions[actionId] !== undefined){
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
    ShellPrototype.setTest = function(conditionId,testId,field,op,value,sourceId){
        console.log(conditionId,testId,field,op,value,sourceId);
        var source = sourceId ? this.getNode(sourceId) : this.cwd;
        if(source.tags.type !== 'rule' && source.tags.type !== 'negConjCondition'){
            throw new Error("Trying to set test on a non-rule node");
        }
        if(source.conditions[conditionId] === undefined || this.getNode(conditionId).constantTests[testId] === undefined){
            throw new Error("trying to set non-existent test");
        }

        var condition = this.getNode(conditionId),
            test = condition.constantTests[testId];
        
        test.field = field;
        test.operator = op;
        test.value = value;
    };


    return ShellPrototype;
});