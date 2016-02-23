if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','./GraphNode','../utils'],function(_,GraphNode,util){

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


    Condition.prototype.getDescriptionObjects = function(){
        var lists = [];
        lists.push({
            name: this.toString()
        });
        
        //Add the constant tests
        lists.push({
            name: "IF:",
            values : this.constantTests.map((d,i)=>`(${i}): wme.data.${d.field} ${util.operatorToString(d.operator)} ${d.value}`)
        });

        //Add the bindings:
        lists.push({
            name: "BIND:",
            values : _.keys(this.bindings).map(d=>`${d} <-- wme.data.${this.bindings[d][0]} :: ${_.flatten(this.bindings[d][1]).join(" ")}`)
        });

        lists.push({
            name : "SOURCE:",
            values : this.expectationNode
        });
        
        return lists;
    };
    
    return Condition;
});
