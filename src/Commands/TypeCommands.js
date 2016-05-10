if(typeof defien !== 'function'){
    var define = require('amdefine')(module);
}

define(['../utils','lodash'],function(util,_){
    "use strict";

    var TypeCommands = {
        "help" : function(globalData,values){

        },
        "draw" : function(globalData, values){

        },
        //define a Link Type or a Relation Type
        "define" : function(globalData,values){
            //type / relation
        },
        
    };
    
    return TypeCommands;
});
