
define(['underscore','Drawing/TraceDrawing'],function(_,TraceDrawing){
    "use strict";

    /**
     Triggering tracery style grammar expansions
     @exports Commands/TraceCommands
     @implements module:Commands/CommandTemplate
     */
    var TraceCommands = {
        /** draw */
        "draw" : function(globalData,values){

        },
        /** cleanup */
        "cleanup" : function(globalData,values){

        },
        /** trace */
        "trace" : function(globalData,values){
            var curNode = globalData.shell.cwd,
                amt = !Number.isNaN(parseInt(values[0])) ? Array(parseInt(values[0])).fill(0) : [0],
                returnVals = amt.map(()=>globalData.shell.traceNode(curNode));
            console.log("Trace Result:",returnVals);
            TraceDrawing.drawTraces(globalData,returnVals);
        },
        /** varsToChildren */
        "varsToChildren" : function(globalData,values){
            var curNode = globalData.shell.cwd,
                message = curNode.values.message || curNode.name,
                vars = message.match(/\$\w+/g);

            vars.forEach(function(d){
                var varName = d.slice(1);
                if(!_.contains(_.values(curNode.children),varName)){
                    globalData.shell.addNode(varName,"children");
                }                
            });
            
        },
    };
    return TraceCommands;
});
