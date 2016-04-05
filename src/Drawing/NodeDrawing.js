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
            leftRegex = globalData.modeState.node.left || globalData.modeState.node.defaultLR[0],
            rightRegex = globalData.modeState.node.right || globalData.modeState.node.defaultLR[1],
            parentsData = _.pairs(nodeToDraw.linkedNodes).filter(d=>leftRegex.test(d[1])).map(d=>[globalData.shell.getNode(d[0]).getShortDescription()]),
            childrenData = _.pairs(nodeToDraw.linkedNodes).filter(d=>rightRegex.test(d[1])).map(d=>[globalData.shell.getNode(d[0]).getShortDescription()]);


        //The group everything is in
        let mainContainer = DrawUtils.createOrShare('mainContainer'),
            //Select (or create) and bind the node
            node = DrawUtils.createOrShare('node',mainContainer)
            .attr("transform",`translate(${commonData.halfWidth},100)`),
            childGroup = DrawUtils.createOrShare('children',mainContainer)
	        .attr("transform",`translate(${commonData.rightOffset},100)`),
            parentGroup = DrawUtils.createOrShare('parents',mainContainer)
    	    .attr("transform",`translate(${commonData.leftOffset},100)`);

        //Promises:
        DrawUtils.drawSingleNode(node,nodeDescriptions,commonData);
        //Draw the children:
        childrenData.unshift([{ name : "Children: "}]);//background?
        commonData.data = childrenData;
        DrawUtils.drawGroup(childGroup,commonData);//x=>[x.getShortDescription()]);
        //Draw the parents
        parentsData.unshift([{name : "Parents: "}]);//background?
        commonData.data = parentsData;
        DrawUtils.drawGroup(parentGroup,commonData);//,x=>[x.getShortDescription()]);
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
