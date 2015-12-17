/**
   @file ReteActions
   @purpose To define the functions that a triggered action can call
*/
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['./ReteArithmeticActions','./ReteDataStructures','underscore'],function(ArithmeticActions,RDS,_){

    if(ArithmeticActions === undefined){
        throw new Error("Arithmetic Actions missing");
    }

    //Action node possible actions:
    var actions = {};

    //NOTE: these will be called after being bound to an action,
    //so 'this' refers to the information stored in an action.

    //not in place, returns a wme to be dealt with elsewhere
    //** @action assert
    actions.assert = function(token,reteNet){
        //create the data object:
        //initialise from the action's 'values' object
        var newWMEData = _.reduce(_.keys(this.values),function(memo,key){
            memo[key] = null;
            var v = this.values[key];
            //if the value starts with #, look it up in the token list
            if(v[0] === "#" || v[0] === "$"){
                //cut off the #
                memo[key] = token.bindings[v.slice(1)];
            }else{
                memo[key] = v;
            }
            return memo;
        },{},this);

        //perform arithmetic:
        _.keys(this.arithmeticActions).forEach(function(key){
            var newVal = Number(newWMEData[key]);
            if(isNaN(newVal)) throw new Error("Arithmetic value should be convertable to a number");
            //look up the function:
            //because the representation form is: a : ["+", 5]
            var action = ArithmeticActions[this.arithmeticActions[key][0]];
            newWMEData[key] = action(newVal,Number(this.arithmeticActions[key][1]));
        },this);

        console.log("Creating new WME from:",newWMEData);
        //Create the wme
        var newWME = new RDS.WME(newWMEData);
        //To be returned to activateActionNode
        return {action: "asserted", payload: newWME};
    };


    //In place retraction. ie: current cycle
    //** @action retract
    actions.retract = function(token,reteNet){
        //get all wmes the token touches:
        var wmes = [];
        var currToken = token;
        while(currToken && currToken.wme !== undefined){
            wmes.push(currToken.wme);
            currToken = currToken.parentToken;
        }

        //get the wmes to remove:
        var wmeIDs = _.values(token.bindings);

        //filter the wmeList by the wmeIDs:
        var toRetract = _.filter(wmes,function(wme){
            return _.contains(wmeIDs,wme.id);
        });

        //retract the wmes
        toRetract.forEach(function(wme){
            removeWME(wme,reteNet);
        });
        
        //return the list of all retracted wmes:
        return {action:"retracted",payload:toRetract};
    };

    //What other actions might i want?
    //aggregate
    //modify
    
    
    return actions;
});
