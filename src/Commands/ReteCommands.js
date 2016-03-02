if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','Drawing/ReteDrawing'],function(_,ReteDraw){
    "use strict";
    /**
     To define the actions a user can perform regarding the retenet
     @exports Commands/ReteCommands
     @implements module:Commands/CommandTemplate
     */
    var reteCommands = {
        /** Clear the rete net 
            @param globalData
            @param values
        */
        "clear" : function(globalData,values){
            console.log("Clearing RETE");
            if(values[0] === 'complete'){
                globalData.shell.clearRete();
            }if(values[0] === 'history'){
                globalData.shell.clearHistory();
            }else{
                globalData.shell.clearProposedActions();
            }
        },
        /** Draw rete results 
            @param globalData
            @param values
        */
        "draw" : function(globalData,values){
            if(ReteDraw.dummy === undefined){
                ReteDraw.DrawNet(globalData,globalData.shell.reteNet);
            }
        },
        /** cleanup 
            @param globalData
            @param values
        */
        "cleanup" : function(globalData,values){
            if(ReteDraw.dummy === undefined){
                ReteDraw.cleanup();
            }
        },
        /** Compile All Rules in the Graph into the ReteNet
            @param globalData
            @param values
        */
        "compile" : function(globalData,values){
            console.log("Compiling Rete");
            globalData.shell.compileRete();
        },
        /** Assert wmes into the retenet
            @param globalData
            @param values
        */
        "assert" : function(globalData,values){
            console.log("Asserting rete:",values);
            //assert the current node as a wme?
            globalData.shell.assertWMEs(values);
        },
        /** Retract wmes from the retenet 
            @param globalData
            @param values
        */
        "retract" : function(globalData,values){
            console.log("Retracting rete:",values);
            globalData.shell.retractWMEs(values);
        },
        /** Step the retenet forwards 
            @param globalData
            @param values
        */
        "ruleStep" : function(globalData,values){
            console.log("Rete Time Step");
            globalData.shell.stepTime();
            //todo: draw the actions being performed this step

        },
        /** Clear the retenet 
            @param globalData
            @param values
        */
        "clearRete" : function(globalData,values){
            _.values(globalData.shell.allNodes).forEach(d=>d.setValue(undefined,"wmeId",undefined));
            globalData.shell.clearRete();

        },
        /** print Rete 
            @param globalData
            @param values
        */
        "printRete" : function(globalData,values){
            console.log(globalData.shell.reteNet);
        },
        /** help 
            @param globalData
            @param values
        */
        "help" : function(globalData,values){
            return {
                "assert": [ "", " Assert all nodes of tag.type.wme"],
                "compile" : [ "", " Compile all rules of tag.type.rule into the rete net"],
                "ruleStep" : [ "", "Increment the rete net time by one, performing scheduled assertions/retractions"],
                "clear" : [ "[complete]", " Clear wmes from the rete net, or reinit the net completely"],
                "printRete" : ["", "Print to console the retenet object for debugging"],
            };
        },
    };
    return reteCommands;
});
