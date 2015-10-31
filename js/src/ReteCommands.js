if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define([],function(){

    var reteCommands = {
        "clear" : function(sh,values){
            console.log("Clearing RETE");
            if(values[0] === 'complete'){
                sh.clearRete();
            }else{
                sh.clearActivatedRules();
            }
        },
        "compile" : function(sh,values){
            console.log("Compiling Rete");
            sh.compileRete();
        },
        //full name: assert as wme:
        "assert" : function(sh,values){
            console.log("Asserting rete");
            //assert the current node as a wme?
            sh.assertChildren();
        },
    };

    return reteCommands;


});
