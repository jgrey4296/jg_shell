if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore'],function(_){

    var util = {};

    util.randomChoice = function(array){
        var randIndex = Math.floor(Math.random() * array.length);
        return array[randIndex];
    };

    return util;
});
