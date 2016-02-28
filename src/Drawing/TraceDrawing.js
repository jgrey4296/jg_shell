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
        //shared data:
        
        
        //create the trace screen if necessary

        //populate 

    };

    /**
       Cleanup
       @function
     */
    TraceDrawInterface.cleanup = DrawUtils.cleanup.bind({},"#traceContainer");
    

    return TraceDrawInterface;
});
