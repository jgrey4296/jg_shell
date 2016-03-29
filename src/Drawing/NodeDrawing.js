define(['underscore','d3','utils','./DrawUtils'],function(_,d3,util,DrawUtils){
    "use strict";
    /**
     The interface to draw Nodes
     @exports Drawing/NodeDrawing
     */
    var NodeDrawInterface = {};

    /**
       Main draw function for a standard GraphNode instance of the shell
       @function
       @param globalData 
       @param node
    */
    NodeDrawInterface.drawNode = function(globalData,nodeToDraw){
        //console.log("Drawing:",nodeToDraw);
        //Fill in Data field as necessary later:
        let commonData = new DrawUtils.CommonData(globalData,null,3);
        commonData.nodeDataSeparator = 10;
        commonData.groupDataSeparator = 10;
        commonData.widthAddition = 10;
        delete commonData.groupNodeTransform;
        //Get Data from the node:
        let nodeDescriptions = nodeToDraw.getDescriptionObjects(),
            childrenData = _.keys(nodeToDraw.children).map(d=>globalData.shell.getNode(d)),
            parentsData = _.keys(nodeToDraw.parents).map(d=>globalData.shell.getNode(d));

        //Add calculated offsets for parents and children:
        commonData.childrenOffset = (commonData.halfWidth + commonData.colWidth) + commonData.halfCol;
        commonData.parentOffset = (commonData.halfWidth - (commonData.colWidth*2)) + commonData.halfCol;

        //The group everything is in
        let mainContainer = DrawUtils.createOrShare('mainContainer'),
            //Select (or create) and bind the node
            node = DrawUtils.createOrShare('node',mainContainer)
            .attr("transform",`translate(${commonData.halfWidth},100)`),
            childGroup = DrawUtils.createOrShare('children',mainContainer)
	        .attr("transform",`translate(${commonData.childrenOffset},100)`),
            parentGroup = DrawUtils.createOrShare('parents',mainContainer)
    	    .attr("transform",`translate(${commonData.parentOffset},100)`);

        //Promises:
        DrawUtils.drawSingleNode(node,nodeDescriptions,commonData);
        //Draw the children:
        commonData.data = childrenData;
        DrawUtils.drawGroup(childGroup,commonData,x=>[x.getShortDescription()]);
        //Draw the parents
        commonData.data = parentsData;
        DrawUtils.drawGroup(parentGroup,commonData,x=>[x.getShortDescription()]);
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
