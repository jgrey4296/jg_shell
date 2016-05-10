define(['lodash','d3','utils','./DrawUtils'],function(_,d3,util,DrawUtils){

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
        //console.log("data:",data);
        let commonData = new DrawUtils.CommonData(globalData,data,1);
        commonData.nodeDataSeparator = 10;
        commonData.groupDataSeparator = 10;
        commonData.widthAddition = 10;

        //main container
        let mainContainer = DrawUtils.createOrShare("mainContainer"),
        //create the log column
            reteLog = DrawUtils.createOrShare("simLog",mainContainer)
            .attr("transform",`translate(${commonData.halfWidth},100)`);
        //draw the column
        DrawUtils.drawGroup(reteLog,data,commonData,d=>([{name: d}]));
    };

    /**
       Remove anything that DrawRete creates
       @function
    */
    SimDrawInterface.cleanup = DrawUtils.cleanup.bind({},"#simLog");

    
    
    return SimDrawInterface;
});
