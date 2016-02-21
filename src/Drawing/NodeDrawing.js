define(['underscore','d3','utils','./DrawUtils'],function(_,d3,util,DrawUtils){
    "use strict";
    var NodeDrawInterface = {},
        columnNames = ["Parents","Node","Children"];

    /**
       @function drawNode
       @param globalData 
       @param node
       @purpose main draw function for a standard GraphNode instance of the shell
    */
    NodeDrawInterface.drawNode = function(globalData,nodeToDraw){
        var standardData = {
            nodeDataSeparator : 10,
            groupDataSeparator : 10,
            widthAddition : 10,
            colHeight : globalData.usableHeight - 150,
            colWidth : globalData.calcWidth(globalData.usableWidth,columnNames.length),
            halfWidth : globalData.halfWidth(),
            globalData : globalData,
            //Get Data from the node:
            nodeDescriptions : nodeToDraw.getDescriptionObjects("id name values tags annotations".split(" ")),
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


        DrawUtils.drawSingleNode(node,standardData.nodeDescriptions,standardData);
        //Draw the children:
        DrawUtils.drawGroup(childGroup,standardData.childrenData,standardData);
        DrawUtils.drawGroup(parentGroup,standardData.parentsData,standardData);


        
        //figure out parent path:
        var path = DrawUtils.pathExtraction(globalData,10).join(" --> "),
            pathText = d3.select("#pathText");
        if(pathText.empty()){
            pathText = d3.select("svg").append("text").attr("id","pathText")
                .style("fill","white")
                .attr("transform","translate(" + (globalData.usableWidth * 0.5) + ",50)")
                .style("text-anchor","middle");
        }
        //use the figured out path
        pathText.text(path);
        
    };


    /**
       @function cleanup
       @purpose Remove anything that drawNode creates
    */
    NodeDrawInterface.cleanup = DrawUtils.cleanup.bind({},"#mainContainer");//".node",".parent",".child");

    return NodeDrawInterface;
});
