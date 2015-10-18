if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

/**
   A Modified shell to (easily) author rules for 
   the rete net in.

   Rather than a root node with tree structure,
   this shell uses a three/four layer representation.
   Tests -> Conditions -> Rules -> Actions


*/
define(['ReteDataStructures'],function(RDS){

    var RuleShell = function(){
        console.log("Creating shell");
        //Rules organised by name
        this.allRulesByName = {};
        //Rules organised by id
        this.allRulesById = [];

        //All Tests
        this.allTests = [];
        //All Conditions
        this.allConditions = [];

        //Current Working Rule:
        this.cwr = undefined;
    };

    //Methods to be used from the cli
    RuleShell.prototype.interface = {
        addRule : undefined,
        addCondition : undefined,
        linkCondition : undefined,
        addBinding : undefined,
        addAction : undefined,
        addTestToCondition : undefined,
        exportToJson : undefined,
        loadJson : undefined,
    };

    //Create a new empty rule
    RuleShell.prototype.interface.addRule = function(name){
        if(this.allRulesByName[name]){
            throw new Error("Rule with name: " + name + " already exists");
        }
        var newRule = new RDS.Rule(name);
        this.allRulesByName[name] = newRule;
        this.allRulesById[newRule.id] = newRule;

        this.cwr = newRule;
    };

    //Create a new empty condition
    RuleShell.prototype.interface.addCondition = function(){
        var newCondition = new RDS.Condition();
        this.allConditions.push(newCondition);
        this.cwr.conditions.push(newCondition);
    };

    //Get and reuse a condition from elsewhere:
    RuleShell.prototype.interface.linkCondition = function(ruleToAddTo,condition){
        console.log("TODO: link condition");
    };
    
    //Register a new binding for the specified condition
    //of the current rule
    RuleShell.prototype.interface.addBinding = function(conditionNumber,bindingPair){
        //validate input
        if(!(bindingPair instanceof Array) || bindingPair.length !== 2) throw new Error("Adding a binding requires a pair");
        if(isNaN(Number(conditionNumber)))throw new Error("Adding a binding requires a condition");

        //add the binding
        var condition = this.cwr.conditions[conditionNumber];
        if(condition){
            condition.bindings.push(bindingPair);
        }else{
            console.warn("No condition found to add a binding to");
        }
    };

    //Add an action to the rule, as a text string defining
    //a function to eval
    RuleShell.prototype.interface.addAction = function(actionDescription){
        if(this.cwr.action === undefined){
            this.cwr.action = actionDescription;
        }else if(this.cwd.action instanceof Array){
            this.cwr.action.push(actionDescription);
        }else{
            var prev = this.cwr.action;
            this.cwr.action = [];
            this.cwr.action.push(prev);
            this.cwr.action.push(actionDescription);
        }
    };

    //Add a test to a specified condition, of the current rule
    RuleShell.prototype.interface.addTestToCondition = function(conditionNumber,test){
        //Validate
        if(!(test instanceof Array) || test.length !== 3) throw new Error("Test needs to be a triplet");
        if(isNaN(Number(conditionNumber))) throw new Error("Adding a test needs a condition number");
                
        //add the test
        var newTest = RDS.ConstantTest(test[0],test[1],test[2]);
        var condition = this.cwr.conditions[Number(conditionNumber)];
        if(condition){
            //TODO: check the test isnt already in there
            condition.constantTests.push(newTest);
        }else{
            console.warn("No Condition found for: " + conditionNumber);
        }
        
    };
    
    //Export each Rule to its json format (nested arrays)
    //to use in constructors
    RuleShell.prototype.interface.exportToJson = function(){

    };

    //Load a json file
    RuleShell.prototype.interface.loadJson = function(json){


    };

    return RuleShell;
    
}); 
