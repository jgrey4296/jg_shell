define(['underscore','d3','utils','./DrawUtils'],function(_,d3,util,DrawUtils){
    "use strict";
    /**
     The interface to draw Nodes
     @exports Drawing/NodeDrawing
     */
    var NodeDrawInterface = {},
        columnNames = ["Parents","Node","Children"];

    /**
       Main draw function for a standard GraphNode instance of the shell
       @function
       @param globalData 
       @param node
    */
    NodeDrawInterface.drawNode = function(globalData,nodeToDraw){
        //console.log("Drawing:",nodeToDraw);
        var standardData = {
            nodeDataSeparator : 10,
            groupDataSeparator : 10,
            widthAddition : 10,
            colHeight : globalData.usableHeight - 150,
            colWidth : globalData.calcWidth(globalData.usableWidth,columnNames.length),
            halfWidth : globalData.halfWidth(),
            globalData : globalData,
            //Get Data from the node:
            nodeDescriptions : nodeToDraw.getDescriptionObjects(),
            childrenData : _.keys(nodeToDraw.children).map(d=>globalData.shell.getNode(d)),
            parentsData : _.keys(nodeToDraw.parents).map(d=>globalData.shell.getNode(d)),
        };

        //Add calculated offsets for parents and children:
        standardData.halfCol = standardData.colWidth * 0.5;
        standardData.childrenOffset = (standardData.halfWidth + standardData.colWidth) + standardData.halfCol;
        standardData.parentOffset = (standardData.halfWidth - (standardData.colWidth*2)) + standardData.halfCol;

        //The group everything is in
        var mainContainer = DrawUtils.createOrShare('mainContainer'),
            //Select (or create) and bind the node
            node = DrawUtils.createOrShare('node',mainContainer)
            .attr("transform",`translate(${standardData.halfWidth},100)`),
            childGroup = DrawUtils.createOrShare('children',mainContainer)
	        .attr("transform",`translate(${standardData.childrenOffset},100)`),
            parentGroup = DrawUtils.createOrShare('parents',mainContainer)
    	    .attr("transform",`translate(${standardData.parentOffset},100)`);

        //Promises:
        DrawUtils.drawSingleNode(node,standardData.nodeDescriptions,standardData);
        //Draw the children:
        DrawUtils.drawGroup(childGroup,standardData.childrenData,standardData,x=>[x.getShortDescription()]);
        DrawUtils.drawGroup(parentGroup,standardData.parentsData,standardData,x=>[x.getShortDescription()]);

        //Draw the current path
        DrawUtils.drawPath(globalData);
    };


    /**
       Remove anything that drawNode creates
       @function
    */
    NodeDrawInterface.cleanup = DrawUtils.cleanup.bind({},"#node","#children","#parents");//".node",".parent",".child");

    return NodeDrawInterface;
});
