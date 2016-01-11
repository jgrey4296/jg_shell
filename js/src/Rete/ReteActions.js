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

    //each function returns an object of the form:
    //{ action: "", payload: {}, (assertionTime,retractionTime)? }
    //Rete Interface.incrementTime uses the action to modify the
    //state of the retenet, and so must have an implemented condition for each
    //function defined here
    
    //NOTE: these will be called after being bound to an action description,
    //so 'this' refers to the information stored in an action/the action object itself,
    //while the token information will be passed in

    //eg: the action asserts a new wme, with an arithmetic action of +2,
    //the action has the information (+ 2), the incoming token as the base value to add to.
    

    //not in place, returns a wme to be dealt with elsewhere
    //** @action assert
    actions.assert = function(token,reteNet){
        //create the data object:
        //initialise from the action's 'values' object
        var newWMEData = _.reduce(_.keys(this.values),function(memo,key){
            memo[key] = null;
            var v = this.values[key];
            //if the value starts with # or $, look it up in the token list
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
        //Actually, DONT create the wme, just store the data for it
        //var newWME = new RDS.WME(newWMEData);
        //To be returned to activateActionNode
        var queuedAction = new RDS.QueuedAction("assert", newWMEData, token,
                                                reteNet.currentTime,
                                                reteNet.currentTime+2,
                                                reteNet.currentTime+1,
                                                0);
        
        
        token.queuedActions.push(actionToQueue);
        return actiontoQueue;        
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

        //get the wme ids to remove:
        var wmeIDs = _.values(token.bindings);

        //filter the wmeList by the wmeIDs:
        var toRetract = _.filter(wmes,function(wme){
            return _.contains(wmeIDs,wme.id);
        });

        //Get all the queuedActions that become invalid if this token isnt true
        //and queue them for removal?

        
        //return the list of all retracted wmes:
        var queuedAction = new RDS.QueuedAction("retract", toRetract, token,
                                                reteNet.currentTime,
                                                reteNet.currentTime+2,
                                                reteNet.currentTime+1,
                                                0);
        return queuedAction;
    };

    //What other actions might i want?
    //aggregate
    //modify
    
    
    return actions;
});
