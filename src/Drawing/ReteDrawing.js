define(['underscore','d3','utils','./DrawUtils'],function(_,d3,util,DrawUtils){

    /** The interface for drawing elements from the retenet
        @exports Drawing/ReteDrawing
     */
    var ReteDrawInterface = {};

    /** Draw the proposed actions
        @function
        @param globalData
        @param {Array.<ProposedAction>} data
     */
    ReteDrawInterface.drawProposed = function(globalData,data){
        var standardData = {
            nodeDataSeparator : 10,
            groupDataSeparator : 10,
            widthAddition : 10,
            colHeight : globalData.usableHeight - 150,
            colWidth : globalData.calcWidth(globalData.usableWidth,2),
            halfWidth : globalData.halfWidth(),
            globalData : globalData,
        };

        //Add calculated offsets for parents and children:
        standardData.halfCol = standardData.colWidth * 0.5;

        //create the main container
        var mainContainer = DrawUtils.createOrShare("mainContainer"),
        //create the proposed column
            proposed = DrawUtils.createOrShare("proposed",mainContainer)
            .attr("transform",`translate(${standardData.halfWidth - standardData.colWidth},100)`);
        //draw the proposed column
        DrawUtils.drawGroup(proposed,data,standardData,function(d){
            return [{
                name : `Propose (${d.id}): ${d.actionType}`,
                values : _.pairs(d.payload).map(function(d){
                    if(d[0] === 'bindings'){
                        return d[0] + JSON.stringify(d[1]);
                    }
                    return d.join(": ");
                })
            }];
        });
    };

        
    /** Draw the scheduled actions
        @function
        @param globalData
        @param {Array.<ProposedAction>} data
     */
    ReteDrawInterface.drawSchedule = function(globalData,data){
        var standardData = {
            nodeDataSeparator : 10,
            groupDataSeparator : 10,
            widthAddition : 10,
            colHeight : globalData.usableHeight - 150,
            colWidth : globalData.calcWidth(globalData.usableWidth,2),
            halfWidth : globalData.halfWidth(),
            globalData : globalData,
        };

        //Add calculated offsets for parents and children:
        standardData.halfCol = standardData.colWidth * 0.5;

        //main container
        var mainContainer = DrawUtils.createOrShare("mainContainer"),
        //create the schedule column
            scheduled = DrawUtils.createOrShare("scheduled",mainContainer)            .attr("transform",`translate(${standardData.halfWidth + standardData.colWidth},100)`);
        //draw the column
        DrawUtils.drawGroup(scheduled,data,standardData,function(d){
            return [{
                name : `Schedule (${d.id}): ${d.actionType}`,
                values : _.pairs(d.payload).map(function(d){
                    if(d[0] === 'bindings'){
                        return d[0] + JSON.stringify(d[1]);
                    }
                    return d.join(": ");
                })
            }];
        });
    };

    
    /** Draw the saved log of rete actions
        @function
        @param globalData
        @param {Array.<String>} data
     */
    ReteDrawInterface.drawLog = function(globalData,data){
        var standardData = {
            nodeDataSeparator : 10,
            groupDataSeparator : 10,
            widthAddition : 10,
            colHeight : globalData.usableHeight - 150,
            colWidth : globalData.calcWidth(globalData.usableWidth,2),
            halfWidth : globalData.halfWidth(),
            globalData : globalData,
        };

        //Add calculated offsets for parents and children:
        standardData.halfCol = standardData.colWidth * 0.5;

        //main container
        var mainContainer = DrawUtils.createOrShare("mainContainer"),
        //create the log column
            reteLog = DrawUtils.createOrShare("reteLog",mainContainer);
        //draw the column
        
        

    };

    /**
       Remove anything that DrawRete creates
       @function
    */
    ReteDrawInterface.cleanup = DrawUtils.cleanup.bind({},"#proposed","#scheduled","#reteLog");

    
    
    return ReteDrawInterface;
});
