if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}
/**
   Describes a node that can behave as a ReteNet Action
   @module Node/Action
 */
define(['lodash','./GraphNode'],function(_,GraphNode){
    "use strict";
    /**
       @constructor Action
       @augments module:Node/GraphNode
     */
    var Action = function(name,parent,actionType,values,overRideId){
        GraphNode.call(this,name,parent,"action",{},overRideId);
        this.tags.actionType = actionType || "assert";
        while(values && values.length >= 2){
            this.values[values.shift()] = values.shift();
        }

        //{keyVal : [op,mod]
        /** Arithmetic Actions
            @type {Object}
        */
        this.arithmeticActions = {};
        //{keyVal : [regex,options,replaceVal]
        /** Regex Actions
            @type {Object}
         */
        this.regexActions = {};

        //Specify timing of proposed action to create,
        //As offsets from the time the action fires
        this.timing = {
            invalidateOffset : 0,
            performOffset : 0,
            unperformOffset: 0
        };
        this.priority = 0;
        
    };
    Action.prototype = Object.create(GraphNode.prototype);
    Action.constructor = Action;

    /** Set Arithmetic Action
        @param val
        @param operator
        @param modifer
     */
    Action.prototype.setArith = function(val,operator,modifier){
        if(arguments.length < 1){ throw new Error("setArith needs at least a value"); }
        if(arguments.length !== 3){
            delete this.arithmeticActions[val];
        }else{
            this.arithmeticActions[val] = [operator,modifier];
        }
    };
    /** set or remove a regex action */
    let regexSplitRegex = /\/(.+)\/(.+)\/(.*)/;

    /** Set Regex Action
        @param val
        @param regex
     */
    Action.prototype.setRegex = function(val,regex){
        if(regex === undefined){
            delete this.regexActions[val];
        }else{
            var splitRegex = regex.match(regexSplitRegex);
            if(splitRegex === null || splitRegex.length !== 4){
                throw new Error("Invalid regex");
            }
            this.regexActions[val] = [splitRegex[1],splitRegex[3],splitRegex[2]];
        }
    };

    /** Set the timing offsets of the action
        @param timeVar
        @param value
     */
    Action.prototype.setTiming = function(timeVar,value){
        if(this.timing[timeVar] !== undefined){
            this.timing[timeVar] = Number(value);
        }
    };


    /**
       Set the priority of the action
       @param {Number} priorityVal
    */
    Action.prototype.setPriority = function(priorityVal){
        if(isNaN(priorityVal)){
            throw new Error("Priority must be a number");
        }
        this.priority = priorityVal;
    };

    /** Convert the Action to a usable description
        @returns {Array}
     */
    Action.prototype.getDescriptionObjects = function(){
        if(this.minimised){
            return [{
                name : this.toString() + "...",
                background : 'title'
            }];
        }
        let lists = _.reject(this.getDescriptionObjectsBase(),d=>d.name==='Values');

        lists.push({
            name : "Data",
            values : _.pairs(this.values).map(d=>d.join(" : ")),
            background : 'data'
        });
        
        lists.push({
            name : "Arithmetic Actions",
            values : _.keys(this.arithmeticActions).map(d=>`${d} ${this.arithmeticActions[d][0]} ${this.arithmeticActions[d][1]}`),
            background : 'arith'
        });

        lists.push({
            name: "Regex Actions",
            values : _.keys(this.regexActions).map(d=>`${d} ~= /${this.regexActions[d][0]}/${this.regexActions[d][2]}/${this.regexActions[d][1]}`),
            background : 'regex'
        });

        lists.push({
            name: "Timing",
            values : _.keys(this.timing).map(d=>`${d} : ${this.timing[d]}`),
            background : 'priority'
        });

        //the sink/prototype nodes
        let sinks = _.pairs(this.linkedNodes).filter(d=>/sink/.test(d[1]));
        if(sinks.length === 0){
            lists.push({
                name : "SINK ID: NULL",
                background : "link"
            });
        }else if(sinks.length === 1){
            lists.push({
                name : `SINK ID: ${sinks[0][0]}`,
                background : 'link'
            });
        }else if(sinks.length > 1){
            lists.push({
                name : "SINK IDS:",
                values : sinks.map(d=>d[0]),
                background : "link"
            });
        }
        
        lists.push({
            name : `Priority: ${this.priority}`,
            background : 'priority'
        });

        return lists;
    };
    
    
    return Action;
});
