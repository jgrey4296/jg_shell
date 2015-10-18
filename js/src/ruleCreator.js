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
        console.log("Shell Created:",this);
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
    RuleShell.prototype.addRule = function(name){
        console.log(this);
        if(this.allRulesByName[name] !== undefined){
            throw new Error("Rule with name: " + name + " already exists");
        }
        var newRule = new RDS.Rule(name);
        this.allRulesByName[name] = newRule;
        this.allRulesById[newRule.id] = newRule;

        this.cwr = newRule;
        console.log("Set CWR to:",newRule);
    };

    //Create a new empty condition
    RuleShell.prototype.addCondition = function(){
        if(!this.cwr) throw new Error("There needs to be a rule to add a condition");
        var newCondition = new RDS.Condition();
        this.allConditions.push(newCondition);
        this.cwr.conditions.push(newCondition);
    };

    //Get and reuse a condition from elsewhere:
    RuleShell.prototype.linkCondition = function(ruleToAddTo,condition){
        console.log("TODO: link condition");
    };
    
    //Register a new binding for the specified condition
    //of the current rule
    RuleShell.prototype.addBinding = function(conditionNumber,bindingPair){
        //validate input
        if(!(this.cwr)) throw new Error("Bindings need an owning rule");
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
    RuleShell.prototype.addAction = function(actionDescription){
        if(this.cwr === undefined) throw new Error("Actions need an owning rule");
            this.cwr.actions.push(actionDescription);
    };

    //Add a test to a specified condition, of the current rule
    RuleShell.prototype.addTestToCondition = function(conditionNumber,test){
        //Validate
        if(!(test instanceof Array) || test.length !== 3) throw new Error("Test needs to be a triplet",test);
        if(isNaN(Number(conditionNumber))) throw new Error("Adding a test needs a condition number");

        console.log("Adding to condition: ",conditionNumber,test);
        
        //add the test
        var newTest = new RDS.Test(test[0],test[1],test[2]);
        console.log("New Test: ",newTest);
        var condition = this.cwr.conditions[Number(conditionNumber)];
        if(condition !== undefined){
            //TODO: check the test isnt already in there
            condition.constantTests.push(newTest);
        }else{
            console.warn("No Condition found for: " + conditionNumber);
        }
        console.log("State of condition after adding:",condition);
    };
    
    //Export each Rule to its json format (nested arrays)
    //to use in constructors
    RuleShell.prototype.exportToJson = function(){

    };

    //Load a json file
    RuleShell.prototype.loadJson = function(json){


    };

    return RuleShell;
    
}); 
