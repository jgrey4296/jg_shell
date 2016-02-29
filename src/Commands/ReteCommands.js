if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','d3'],function(_,d3){
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
            //calculations:
            var colWidth = globalData.calcWidth(globalData.usableWidth,5);
            var halfWidth = globalData.halfWidth();
            
            //todo: draw... facts? tokens? possible actions?

            //draw asserted wmes -> actions
            var wmes = globalData.shell.reteNet.allWMEs.filter(function(d){
                return d !== undefined;
            });
            var actions = globalData.shell.reteNet.proposedActions;

            var wmeColumn = d3.select("#mainContainer").append("g")
                .attr("id","wmeColumn");
            var actionColumn = d3.select("#mainContainer").append("g")
                .attr("id","actionColumn");

            // var wmeNodeHeight = drawGroup(globalData,wmeColumn,wmes,"wme",(halfWidth - (colWidth * 2)), colWidth);
            // annotateWmes(wmeColumn,wmeNodeHeight);
            // var actionNodeHeight = drawGroup(globalData,actionColumn,actions,"action",(halfWidth + (colWidth)),colWidth);
            // annotateActions(actionColumn,actionNodeHeight);
            
        },
        /** cleanup 
            @param globalData
            @param values
        */
        "cleanup" : function(globalData,values){
            d3.select("#wmeColumn").remove();
            d3.select("#actionColumn").remove();
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
