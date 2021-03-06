import _ from 'lodash';
import { GraphNode } from './GraphNode';
import { util } from '../utils';

/**
   Defines a Condition, to interface with ReteNet
   @module Node/Condition
   @see {@link Node/Condition}
*/

let allowableConditionTypes = [
    "positive","negative","negConjCondition"
];

/**
   @constructor
   @augments Node/GraphNode
   @alias Node/Condition
*/
let Condition = function(name,parent,type,relations,overRideId){
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

};
Condition.prototype = Object.create(GraphNode.prototype);
Condition.constructor = Condition;

/**
   Prefered way to set the condition type, safely
   @param {String} conditionType
*/
Condition.prototype.setConditionType = function(conditionType){
    if (allowableConditionTypes.indexOf(conditionType) !== -1){
        this.tags.conditionType = conditionType;
    } else {
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
    if (arguments < 2){
        this.constantTests.splice(testId,1);
    } else if (testId !== undefined && this.constantTests[testId] !== undefined){
        this.constantTests[testId] = {
            field : testField,
            operator : op,
            value : val
        };
    } else {
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
    if (arguments < 2){
        delete this.bindings[toVar];
    } else {
        this.bindings[toVar] = [fromVar,testPairs];
    }
};

/** get Description objects */
Condition.prototype.getDescriptionObjects = function(){
    //minimal version:
    if (this.minimised){
        return [{
            name : this.toString() + "...",
            background : 'title'
        }];
    }
    //NCC version
    if (this.tags.conditionType === "negConjCondition"){
        let nccList = [];
        nccList.push({
            name : this.toString(),
            background : "title"
        });

        nccList.push({
            name : "Conditions",
            values : _.toPairs(this.linkedNodes).filter(d=>/^condition/.test(d[1])).map(d=>d.join(" : ")),
            background : "link"
        });

        nccList.push({
            name : "Tags",
            values : _.toPairs(this.tags).map(d=>d.join(" : ")),
            background : "tags"
        });

        return nccList;
    }

    //Main version:
    let lists = [];
    lists.push({
        name: this.toString(),
        background : 'title'
    });
    
    //Add the constant tests
    lists.push({
        name: "IF:",
        values : this.constantTests.map((d,i)=>`(${i}): wme.data.${d.field} ${util.operatorToString(d.operator)} ${d.value}`),
        background : 'test'
    });

    //Add the bindings:
    lists.push({
        name: "BIND:",
        values : _.keys(this.bindings).map(function(d){
            if (/^[#\$]id/.test(d[0])){
                return `${d} <-- wme.id :: ${_.flatten(this.bindings[d][1]).join(" ")}`;
            }
            return `${d} <-- wme.data.${this.bindings[d][0]} :: ${_.flatten(this.bindings[d][1]).join(" ")}`;
        },this),
        background : 'binding'
        //d=>`${d} <-- wme.data.${this.bindings[d][0]} :: ${_.flatten(this.bindings[d][1]).join(" ")}`)
    });

    //the source node
    let sources = _.toPairs(this.linkedNodes).filter(d=>/source/.test(d[1]));
    if (sources.length === 0){
        lists.push({
            name : "SOURCE ID: NULL",
            background : "link"
        });
    } else if (sources.length === 1){
        lists.push({
            name : `SOURCE ID: ${sources[0][0]}`,
            background : 'link'
        });
    } else if (sources.length > 1){
        lists.push({
            name : "SOURCE IDS:",
            values : sources.map(d=>d[0]),
            background : "link"
        });
    }
    
    //tags:
    lists.push({
        name : "Tags",
        values : _.keys(this.tags).map(d=>`${d} : ${this.tags[d]}`),
        background : 'tags'
    });

    
    return lists;
};


Condition.prototype.getActiveLinks = function(keyList){
    if (keyList === undefined) { keyList = ['children','parents','conditions']; }
    //take a keylist, return an array of all ids in those fields
    let members = new Set();
    keyList.forEach(function(key){
        if (typeof this[key] !== 'object'){ return; }
        _.keys(this[key]).forEach(d=>members.add(d));
    },this);

    return Array.from(members);


};


export { Condition };

