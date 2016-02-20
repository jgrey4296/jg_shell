if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','./GraphNode'],function(_,GraphNode){

    var Condition = function(name,parent,type,relations,overRideId){
        GraphNode.call(this,name,parent,"condition",{},overRideId);
        this.tags.isPositive = true;
        this.tags.isNegative = false;

        //Test objects of form: { field: "", operator: "", value : "" }
        this.constantTests = [];
        //Bindings object: { boundVar : [sourceVar, [tests]] }
        this.bindings = {};
        //Source node
        this.expectationNode = null;
    };
    Condition.prototype = Object.create(GraphNode.prototype);
    Condition.constructor = Condition;

    //Modify a constant test in the condition
    Condition.prototype.setTest = function(testId,testField,op,val){
        if(arguments < 2){
            this.constantTests.splice(testId,1);
        }else if(testId !== undefined && this.constantTests[testId] !== undefined){
            this.constantTests[testId] = {
                field : testField,
                operator : op,
                value : val
            };
        }else{
            this.constantTests.push({
                field : testField,
                operator : op,
                value : val
            });
        }
    };

    Condition.prototype.setBinding = function(toVar,fromVar,testPairs){
        if(arguments < 2){
            delete this.bindings[toVar];
        }else{
            this.bindings[toVar] = [fromVar,testPairs];
        }
    };

    
    return Condition;
});
