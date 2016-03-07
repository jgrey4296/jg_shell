define(['underscore','d3','utils','./DrawUtils'],function(_,d3,util,DrawUtils){

    /** The interface for drawing elements from the retenet
        @exports Drawing/SimDrawing
     */
    var SimDrawInterface = {};

    /** Draw the output sim log
        @function
        @param globalData
        @param {Array.<String>} data
     */
    SimDrawInterface.drawLog = function(globalData,data){
        //add the title:
        data = ["Sim Output Log:"].concat(data);
        console.log("data:",data);
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

        //main container
        var mainContainer = DrawUtils.createOrShare("mainContainer"),
        //create the log column
            reteLog = DrawUtils.createOrShare("simLog",mainContainer)
            .attr("transform",`translate(${standardData.halfWidth},100)`);
        //draw the column
        DrawUtils.drawGroup(reteLog,data,standardData,d=>([{name: d}]));
    };

    /**
       Remove anything that DrawRete creates
       @function
    */
    SimDrawInterface.cleanup = DrawUtils.cleanup.bind({},"#simLog");

    
    
    return SimDrawInterface;
});
