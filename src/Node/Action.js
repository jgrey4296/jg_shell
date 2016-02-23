if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','./GraphNode'],function(_,GraphNode){
    "use strict";
    var Action = function(name,parent,actionType,values,overRideId){
        GraphNode.call(this,name,parent,"action",{},overRideId);
        this.tags.actionType = actionType || "assert";
        while(values && values.length >= 2){
            this.values[values.shift()] = values.shift();
        }

        //{keyVal : [op,mod]
        this.arithmeticActions = {};
        //{keyVal : [regex,options,replaceVal]
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
    };
    //set or remove a regex action
    var regexSplitRegex = /\/(.+)\/(.+)\/(.*)/;
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

    Action.prototype.getDescriptionObjects = function(){
        var lists = [];
        lists.push({
            name : this.toString(),
        });

        lists.push({
            name : "Tags",
            values : _.pairs(this.tags).map(d=>d.join(" : "))
        });

        lists.push({
            name : "Data",
            values : _.pairs(this.values).map(d=>d.join(" : "))
        });
        
        lists.push({
            name : "Arithmetic Actions",
            values : _.keys(this.arithmeticActions).map(d=>`${d} ${this.arithmeticActions[d][0]} ${this.arithmeticActions[d][1]}`)
        });

        lists.push({
            name: "Regex Actions",
            values : _.keys(this.regexActions).map(d=>`${d} ~= /${this.regexActions[d][0]}/${this.regexActions[d][2]}/${this.regexActions[d][1]}`)
        });
        
        return lists;
    };
    
    
    return Action;
});
