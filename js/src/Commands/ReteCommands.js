/**
   @file ReteCommands
   @purpose To define the actions a user can perform regarding the retenet
*/
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define([],function(){

    /**
       @data reteCommands
       @purpose describes the user actions that can be performed in the shell regarding the rete net
     */
    var reteCommands = {
        //** @command clear
        "clear" : function(globalData,values){
            console.log("Clearing RETE");
            if(values[0] === 'complete'){
                sh.clearRete();
            }else{
                sh.clearActivatedRules();
            }
        },
        //** @command compile
        "compile" : function(globalData,values){
            console.log("Compiling Rete");
            sh.compileRete();
        },
        //** @command assert
        //full name: assert as wme:
        "assert" : function(globalData,values){
            console.log("Asserting rete");
            //assert the current node as a wme?
            sh.assertChildren();
        },
        "ruleStep" : function(globalData,values){
            console.log("Rete Time Step");
            sh.stepTime();

        },
        "help" : function(globalData,values){
            return {
                "assert": [ "", " Assert all children of the cwd as wmes"],
                "compile" : [ "", " Compile all rules in the shell into the rete net"],
                "ruleStep" : [ "", " Perform the actions of the fired rules from the last assertion"],
                "clear" : [ "[complete]", " Clear wmes from the rete net, or reinit the net completely"],
            };
        },
    };

    return reteCommands;


});
