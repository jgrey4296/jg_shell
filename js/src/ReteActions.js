if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['./ReteArithmeticActions','underscore'],function(ArithmeticActions,_){
    //Action node possible actions:
    var actions = {};

    //In place assertions (ie: for the current execution cycle, not the next one
    actions.in_place_assert = function(token,reteNet){
        //create the data object:
        var newWMEData = {};
        //initialise from the action's 'values' object
        _.keys(this.values).forEach(function(key){
            newWMEData[key] = null;
            var v = this.values[key];
            //if the value starts with #, look it up in the token
            if(v[0] === "#"){
                //cut off the #
                newWMEData[key] = token.bindings[v.slice(1)];
            }else{
                newWMEData[key] = v;
            }
        },this);

        //perform arithmetic:
        _.keys(this.arithmeticActions).forEach(function(key){
            newWMEData[key] = Number(newWMEData[key]);
            if(isNaN(newWMEData[key])) throw new Error("Arithmetic value should be convertable to a number");
            //look up the function:
            //because the representation form is: a : ["+", 5]
            var action = ArithmeticActions[this.arithmeticActions[key][0]];
            newWMEData[key] = action(newWMEData[key],this.arithmeticActions[key][1]);
        },this);

        return {action: "asserted", payload: addWME(newWMEData,reteNet)};
    };


    //In place retraction. ie: current cycle
    actions.in_place_retract = function(token,reteNet){
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
