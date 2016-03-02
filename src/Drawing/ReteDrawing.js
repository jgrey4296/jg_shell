define(['underscore','d3','utils','./DrawUtils'],function(_,d3,util,DrawUtils){

    /** The interface for drawing elements from the retenet
        @exports Drawing/ReteDrawing
     */
    var ReteDrawInterface = {};

    /** Draw the entire network. 
        @function
        @param globalData
        @param net
     */
    ReteDrawInterface.drawNet = function(globalData,net){
        var standardData = {
            nodeDataSeparator : 10,
            groupDataSeparator : 10,
            widthAddition : 10,
            colHeight : globalData.usableHeight - 150,
            colWidth : globalData.calcWidth(globalData.usableWidth,columnNames.length),
            halfWidth : globalData.halfWidth(),
            globalData : globalData,
            //Get Data from the node:
            nodeDescriptions : nodeToDraw.getDescriptionObjects("id name values tags annotations expectedBy producedBy".split(" ")),
            childrenData : _.keys(nodeToDraw.children).map(d=>globalData.shell.getNode(d)),
            parentsData : _.keys(nodeToDraw.parents).map(d=>globalData.shell.getNode(d)),
            
        };

        //Add calculated offsets for parents and children:
        standardData.halfCol = standardData.colWidth * 0.5;
        standardData.childrenOffset = (standardData.halfWidth + standardData.colWidth) + standardData.halfCol;
        standardData.parentOffset = (standardData.halfWidth - (standardData.colWidth*2)) + standardData.halfCol;


    };

    /**
       Remove anything that DrawRete creates
       @function
    */
    ReteDrawInterface.cleanup = DrawUtils.cleanup.bind({},"#node");


    return ReteDrawInterface;
});
