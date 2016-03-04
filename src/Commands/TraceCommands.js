
define(['underscore','Drawing/TraceDrawing'],function(_,TraceDrawing){
    "use strict";

    /**
     Triggering tracery style grammar expansions
     @exports Commands/TraceCommands
     @implements module:Commands/CommandTemplate
     */
    var TraceCommands = {
        /** draw 
            @param globalData
            @param values
        */
        "draw" : function(globalData,values){
            if(TraceDrawing.dummy === undefined){
                TraceDrawing.drawTraces(globalData,globalData.lastTraces);
            }
        },
        /** cleanup 
            @param globalData
            @param values
        */
        "cleanup" : function(globalData,values){
            TraceDrawing.cleanup();
        },
        /** Expand a trace of a node 
            @param globalData
            @param {Array} values of [amt,nodeId]
        */
        "trace" : function(globalData,values){
            var amt = !isNaN(parseInt(values[0])) ? Array(parseInt(values.shift())).fill(0) : [0],
                curNode = values[0] !== undefined ? globalData.shell.getNode(values[0]) : globalData.shell.cwd,
                returnVals = amt.map(()=>globalData.shell.traceNode(curNode));
            console.log("Trace Result:",returnVals);
            globalData.lastTraces = {
                id : curNode.id,
                name : curNode.name,
                values : returnVals
            };
        },
        /** Convert trace variables to children 
            @param globalData
            @param values
        */
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
