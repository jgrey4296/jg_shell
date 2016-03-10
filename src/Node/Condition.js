if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}
/**
   Defines a Condition, to interface with ReteNet
   @module Node/Condition
   @see {@link Node/Condition}
 */
define(['underscore','./GraphNode','../utils'],function(_,GraphNode,util){
    "use strict";

        var allowableConditionTypes = [
            "positive","negative","negConjCondition"
        ];

    
    /**
       @constructor
       @augments Node/GraphNode
       @alias Node/Condition
     */
    var Condition = function(name,parent,type,relations,overRideId){
        GraphNode.call(this,name,parent,"condition",{},overRideId);
        this.tags.conditionType = 'positive';


        //Test objects of form: { field: "", operator: "", value : "" }
        /** Constant Tests
            @type {Array}
         */
        this.constantTests = [];
        //Bindings object: { boundVar : [sourceVar, [tests]] }
        /** Bindings
            @type {Object}
         */
        this.bindings = {};
        /** The source node the condtion consumes
            @type {Int}
         */
        this.expectationNode = null;

        /**
           Sub-conditions, for when the condition is a negated conjunctive condition
        */
        this.conditions = {};
    };
    Condition.prototype = Object.create(GraphNode.prototype);
    Condition.constructor = Condition;

    /**
       Prefered way to set the condition type, safely
       @param {String} conditionType
    */
    Condition.prototype.setConditionType = function(conditionType){
        if(allowableConditionTypes.indexOf(conditionType) !== -1){
            this.tags.conditionType = conditionType;
        }else{
            throw new Error("Unrecognised condition type");
        }
    };
    
    /** Modify a constant test in the condition 
        @param testId
        @param testField
        @param op
        @param val
     */
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
    /** set binding 
        @param toVar
        @param fromVar
        @param testPairs
     */
    Condition.prototype.setBinding = function(toVar,fromVar,testPairs){
        if(arguments < 2){
            delete this.bindings[toVar];
        }else{
            this.bindings[toVar] = [fromVar,testPairs];
        }
    };

    /** get Description objects */
    Condition.prototype.getDescriptionObjects = function(){
        if(this.minimised){
            return [{
                name : this.toString() + "..."
            }];
        }
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
            values : _.keys(this.bindings).map(function(d){
                if(/^[#\$]id/.test(d[0])){
                    return `${d} <-- wme.id :: ${_.flatten(this.bindings[d][1]).join(" ")}`;
                }else{
                    return `${d} <-- wme.data.${this.bindings[d][0]} :: ${_.flatten(this.bindings[d][1]).join(" ")}`;
                }
            },this)
            //d=>`${d} <-- wme.data.${this.bindings[d][0]} :: ${_.flatten(this.bindings[d][1]).join(" ")}`)
        });

        //the source node
        lists.push({
            name : `SOURCE ID: ${this.expectationNode}`
        });

        //tags:
        lists.push({
            name : "Tags",
            values : _.keys(this.tags).map(d=>`${d} : ${this.tags[d]}`)
        });

        
        return lists;
    };



    
    return Condition;
});
