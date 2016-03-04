define(['underscore','d3','./DrawUtils'],function(_,d3,DrawUtils){
    "use strict";
    /**
       The interface for drawing traces
       @exports Drawing/TraceDrawing
     */
    var TraceDrawInterface = {};

    /**
       Draw Traces
       @function
     */
    TraceDrawInterface.drawTraces = function(globalData,data){
                var standardData = {
            nodeDataSeparator : 10,
            groupDataSeparator : 10,
            widthAddition : 10,
            colHeight : globalData.usableHeight - 150,
            colWidth : globalData.calcWidth(globalData.usableWidth,1),
            halfWidth : globalData.halfWidth(),
            globalData : globalData,
        };

        //Add calculated offsets for parents and children:
        standardData.halfCol = standardData.colWidth * 0.5;

        //create the main container
        var mainContainer = DrawUtils.createOrShare("mainContainer"),
        //create the proposed column
            proposed = DrawUtils.createOrShare("traces",mainContainer)
            .attr("transform",`translate(${standardData.halfWidth},100)`);

        //transform the data to a simple array:
        var traceData = [];
        traceData.push(`Trace for (${data.id}) ${data.name}:`);
        traceData = traceData.concat(data.values);
        
        //draw the proposed column
        DrawUtils.drawGroup(proposed,traceData,standardData);
    };

    /**
       Cleanup
       @function
     */
    TraceDrawInterface.cleanup = DrawUtils.cleanup.bind({},"#traces");
    

    return TraceDrawInterface;
});
