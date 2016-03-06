define(['underscore','d3','utils','./DrawUtils'],function(_,d3,util,DrawUtils){
    "use strict";
    /**
       The interface for drawing a rule
       @exports Drawing/RuleDrawing
     */
    var RuleDrawInterface = {},
        columnNames = ["Conditions","Rule","Actions"];

    /**
       Main draw function for a standard rule instance of the shell
       @function
       @param globalData 
       @param node
    */
    RuleDrawInterface.drawRule = function(globalData,ruleToDraw){
        var standardData = {
            nodeDataSeparator : 10,
            groupDataSeparator : 10,
            widthAddition : 10,
            colHeight : globalData.usableHeight - 150,
            colWidth : globalData.calcWidth(globalData.usableWidth,columnNames.length),
            halfWidth : globalData.halfWidth(),
            globalData : globalData,
            /** Get Data from the node: */
            ruleDescriptions : ruleToDraw.getDescriptionObjects("id name tags annotations".split(" ")),
            conditionData : _.keys(ruleToDraw.conditions).map(d=>globalData.shell.getNode(d)),
            actionData : _.keys(ruleToDraw.actions).map(d=>globalData.shell.getNode(d)),
        };

        //Add calculated offsets for conditions and actions
        standardData.halfCol = standardData.colWidth * 0.5;
        standardData.actionOffset = (standardData.halfWidth + standardData.colWidth) + standardData.halfCol;
        standardData.conditionOffset = (standardData.halfWidth - (standardData.colWidth*2)) + standardData.halfCol;

        //The group everything is in
        var mainContainer = DrawUtils.createOrShare('mainContainer'),
            //Select (or create) and bind the node
            rule = DrawUtils.createOrShare('rule',mainContainer)
            .attr("transform",`translate(${standardData.halfWidth},100)`),
            conditionGroup = DrawUtils.createOrShare('conditions',mainContainer)
	        .attr("transform",`translate(${standardData.conditionOffset},100)`),
            actionGroup = DrawUtils.createOrShare('actions',mainContainer)
    	    .attr("transform",`translate(${standardData.actionOffset},100)`);


        //These are promises
        DrawUtils.drawSingleNode(rule,standardData.ruleDescriptions,standardData);
        //Draw the children:
        DrawUtils.drawGroup(conditionGroup,standardData.conditionData,standardData,x=>x.getDescriptionObjects());
        DrawUtils.drawGroup(actionGroup,standardData.actionData,standardData,x=>x.getDescriptionObjects());

        DrawUtils.drawPath(globalData);
        
    };


    /**
       Remove anything that drawNode creates
       @function
    */
    RuleDrawInterface.cleanup = DrawUtils.cleanup.bind({},"#conditions","#actions","#rule");//".node",".parent",".child");

    return RuleDrawInterface;
});
