if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','./GraphNode'],function(_,GraphNode){

    var Action = function(name,parent,actionType,values,overRideId){
        GraphNode.call(this,name,parent,"action",{},overRideId);
        this.tags.actionType = actionType || "assert";
        while(values && values.length >= 2){
            baseNode.values[values.shift()] = values.shift();
        }

        this.arithmeticActions = {};
        this.regexActions = {};
        //Fact link that this action produces
        this.expectationNode = null;

        
    };
    Action.prototype = Object.create(GraphNode.prototype);
    Action.constructor = Action;

    //Set or remove an arithmetic action
    Action.prototype.setArith = function(val,operator,modifier){
        if(arguments.length < 1){ throw new Error("setArith needs at least a value"); }
        if(arguments.length !== 3){
            delete this.arithmeticActions[val];
        }else{
            this.arithmeticActions[val] = [operator,modifier];
        }
    }
    //set or remove a regex action
    var regexSplitRegex = /\/(.+)\/(.+)\/(.*)/;
    Action.prototype.setRegex = function(val,regex,options,replaceValue){
        if(regex === undefined){
            delete this.regexActions[val];
        }else{
            var splitRegex = regex.match(regexSplitRegex);
            if(splitRegex === null || splitRegex.length !== 4){
                throw new error("Invalid regex");
            }
            this.regexActions[val] = [splitRegex[1],splitRegex[3],splitRegex[2]];
        }
    }

    
    return Action;
});
