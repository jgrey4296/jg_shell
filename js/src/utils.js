if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore'],function(_){

    var util = {};

    //utility function to check input values for commands:
    util.valueCheck = function(list,requiredLength){
        if(list.length !== requiredLength){
            throw new Error("Incorrect number of arguments: " + list);
        }
    };

    
    util.randomChoice = function(array){
        var randIndex = Math.floor(Math.random() * array.length);
        return array[randIndex];
    };

    return util;
});
