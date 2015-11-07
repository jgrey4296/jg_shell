/**
   @file ReteCommands
   @purpose To define the actions a user can perform regarding the retenet
*/
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define([],function(){

    var reteCommands = {
        //** @command clear
        "clear" : function(sh,values){
            console.log("Clearing RETE");
            if(values[0] === 'complete'){
                sh.clearRete();
            }else{
                sh.clearActivatedRules();
            }
        },
        //** @command compile
        "compile" : function(sh,values){
            console.log("Compiling Rete");
            sh.compileRete();
        },
        //** @command assert
        //full name: assert as wme:
        "assert" : function(sh,values){
            console.log("Asserting rete");
            //assert the current node as a wme?
            sh.assertChildren();
        },
    };

    return reteCommands;


});
