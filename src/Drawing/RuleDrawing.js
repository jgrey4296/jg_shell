/* jshint esversion : 6 */
define(['underscore','d3','utils','./DrawUtils'],function(_,d3,util,DrawUtils){
    "use strict";
    /**
       The interface for drawing a rule
       @exports Drawing/RuleDrawing
    */
    var RuleDrawInterface = {};

    /**
       Main draw function for a standard rule instance of the shell
       @function
       @param globalData 
       @param node
    */
    RuleDrawInterface.drawRule = function(globalData,ruleToDraw){
        let commonData = new DrawUtils.CommonData(globalData,null,3);
        commonData.nodeDataSeparator = 10;
        commonData.groupDataSeparator = 10;
        commonData.widthAddition = 10;
        /* Get Data from the node= */
        commonData.data = ruleToDraw.getDescriptionObjects("id name tags annotations".split(" "));
        delete commonData.groupNodeTransform;

        
        //condition data transform
        let conditionData = _.keys(ruleToDraw.linkedNodes.conditions).map(function(d){
            let node = globalData.shell.getNode(d);
            if(node instanceof globalData.shell.getCtor('condition')){
                return node.getDescriptionObjects();
            }else {
                return [node.getShortDescription()];
            }
        }),
            //action data transform
            actionData = ruleToDraw.actions ? _.keys(ruleToDraw.linkedNodes.actions).map(function(d){
                let node = globalData.shell.getNode(d);
                if(node instanceof globalData.shell.getCtor('action')){
                    return node.getDescriptionObjects();
                }else{
                    return [node.getShortDescription()];
                }
            }) : [],
            // BINDING EXTRACTION:
            allConditionBindings = globalData.shell.getConditionBindings(ruleToDraw),
            allActionBindings = globalData.shell.getActionBindings(ruleToDraw),
            //Get the mismatches:
            misMatchSet = _.difference(allActionBindings,allConditionBindings);

        
        //store the results:
        commonData.data.push({
            name : "Condition Bindings",
            values : allConditionBindings,
            background : 'binding'
        });
        commonData.data.push({
            name : "Action Bindings",
            values : allActionBindings,
            background : 'binding'
        });

        if(misMatchSet.length > 0){
            commonData.data.push({
                name : "MISMATCHES",
                values : misMatchSet,
                background : "warning"
            });
        }
        console.log("Final description:",commonData.data);

        //----
        //The master group:
        let mainContainer = DrawUtils.createOrShare('mainContainer'),
            //Select (or create) and bind the node
            rule = DrawUtils.createOrShare('rule',mainContainer)
            .attr("transform",`translate(${commonData.halfWidth},100)`),
            //
            conditionGroup = DrawUtils.createOrShare('conditions',mainContainer)
	        .attr("transform",`translate(${commonData.leftOffset},100)`),
            //
            actionGroup = DrawUtils.createOrShare('actions',mainContainer)
    	    .attr("transform",`translate(${commonData.rightOffset},100)`);


        //These are promises
        DrawUtils.drawSingleNode(rule,commonData.data,commonData);
        //Draw the conditions:
        conditionData.unshift([{name: "Conditions:"}]);
        commonData.data = conditionData;
        DrawUtils.drawGroup(conditionGroup,commonData);
        //draw the actions:
        actionData.unshift([{name:"Actions:"}]);
        commonData.data = actionData;
        DrawUtils.drawGroup(actionGroup,commonData);
        DrawUtils.drawPath(globalData);
    };

    /**
       Remove anything that drawNode creates
       @function
    */
    RuleDrawInterface.cleanup = DrawUtils.cleanup.bind({},"#conditions","#actions","#rule");//".node",".parent",".child");

    return RuleDrawInterface;
});
