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
        //transform the data to a simple array:
        let traceData = [];
        traceData.push(`Trace for (${data.id}) ${data.name}:`);
        traceData = traceData.concat(data.values);

        let commonData = new DrawUtils.CommonData(globalData,traceData,1);
        commonData.nodeDataSeparator = 10;
        commonData.groupDataSeparator = 10;
        commonData.widthAddition = 10;

        //create the main container
        let mainContainer = DrawUtils.createOrShare("mainContainer"),
        //create the proposed column
            proposed = DrawUtils.createOrShare("traces",mainContainer)
            .attr("transform",`translate(${commonData.halfWidth},100)`);

        
        //draw the proposed column
        DrawUtils.drawGroup(proposed,commonData);
    };

    /**
       Cleanup
       @function
     */
    TraceDrawInterface.cleanup = DrawUtils.cleanup.bind({},"#traces");
    

    return TraceDrawInterface;
});
