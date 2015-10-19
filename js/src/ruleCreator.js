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
        removeRule : undefined,
        addCondition : undefined,
        removeCondition : undefined,
        linkCondition : undefined,
        addBinding : undefined,
        removeBinding : undefined,
        addAction : undefined,
        removeAction : undefined,
        addTestToCondition : undefined,
        removeTest : undefined,
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

    //remove the current rule
    RuleShell.prototype.removeRule = function(){
        console.log("Cwr starting as:",this.cwr);
        var ruleToRemove = this.cwr;
        //remove from the allRulesByName list
        delete this.allRulesByName[ruleToRemove.name];
        
        //remove from the id list
        this.allRulesById.splice(ruleToRemove.id,1);
        
        //remove it's tests?
        //remove its conditions?

        //set the cwr to something else
        this.cwr = undefined;
        var RuleKeys = Object.keys(this.allRulesByName);
        console.log("Keys:",RuleKeys);
        var index = 0;
        while(index < RuleKeys.length && this.cwr === undefined){
            this.cwr = this.allRulesByName[RuleKeys[index]];
            index++;
        }
        console.log("Set cwr to:",this.cwr);
    };


    //--------------------
    
    //Create a new empty condition
    RuleShell.prototype.addCondition = function(){
        if(!this.cwr) throw new Error("There needs to be a rule to add a condition");
        var newCondition = new RDS.Condition();
        this.allConditions.push(newCondition);
        this.cwr.conditions.push(newCondition);
    };


    RuleShell.prototype.removeCondition = function(conditionNumber){
        if(isNaN(Number(conditionNumber))){
            throw new Error("Remove condition takes a condition number");
        }
        console.log("rm condition. starting length:",this.cwr.conditions.length);
        var theCondition = this.cwr.conditions[Number(conditionNumber)];
        //remove the condition from allConditions?
        //remove its tests?

        this.cwr.conditions.splice(conditionNumber,1);
        console.log("ending condition length:",this.cwr.conditions.length);
    };
    
    //Get and reuse a condition from elsewhere:
    RuleShell.prototype.linkCondition = function(ruleToAddTo,condition){
        console.log("TODO: link condition");
    };

    //--------------------


    
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

    RuleShell.prototype.removeBinding = function(conditionNumber,boundVar){
        console.log("Removing binding:",conditionNumber,boundVar);
        //validate entry
        if(!(this.cwr)) throw new Error("Bindings need an owning rule");
        if(isNaN(Number(conditionNumber)))throw new Error("Adding a binding requires a condition");
        //get the condition:
        var condition = this.cwr.conditions[conditionNumber];
        if(condition === undefined) return;
        condition.bindings = condition.bindings.filter(function(d){
            return d[0] !== boundVar;
        });        
    };

    
    //--------------------

    
    //Add an action to the rule, as a text string defining
    //a function to eval
    //Rule possibilities:
    //Types:
    //Assert, retract, modify, aggregate?
    //Foci:
    //action, fact, rule
    
    RuleShell.prototype.addAction = function(actionParamList){
        if(this.cwr === undefined) throw new Error("Actions need an owning rule");
        var actionType = actionParamList[0];
        var actionFocus = actionParamList[1];
        var aDesc = new RDS.ActionDescription(actionType,actionFocus);
        
        this.cwr.actions.push(aDesc);
    };
    
    RuleShell.prototype.removeAction = function(actionNumber){
        //validate:
        if(isNaN(Number(actionNumber))){
            throw new Error("Removal of action requires its index");
        }
        this.cwr.actions.splice(actionNumber,1);        
    };
    
    RuleShell.prototype.specifyAction = function(actionNumber,params){
        //validate:
        if(isNaN(Number(actionNumber))){
            throw new Error("Specify action takes the action index");
        }
        //get the action
        var action = this.cwr.actions[Number(actionNumber)];
        if(action){
            action.values[params[0]] = params[1];
        };        
    }
    
    
    //--------------------
    
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

    RuleShell.prototype.removeTest = function(conditionNumber,testNumber){
        //validate:
        if(isNaN(Number(conditionNumber)) || isNaN(Number(testNumber))){
            throw new Error("removal of Test requires 2 indices");
        }

        var condition = this.cwr.conditions[conditionNumber];
        if(condition === undefined) return;
        var test = condition.constantTests[testNumber];
        if(test === undefined) return;

        //remove the test
        condition.constantTests.splice(testNumber,1);
        //TODO:cleanup from all tests?
    };

    
    //--------------------

    
    //Export each Rule to its json format (nested arrays)
    //to use in constructors
    RuleShell.prototype.exportToJson = function(){

    };

    //Load a json file
    RuleShell.prototype.loadJson = function(json){


    };

    return RuleShell;
    
}); 
