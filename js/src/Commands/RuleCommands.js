/**
   @file RuleCommands
   @purpose To implement all user commands dealing with rules
*/

define(['d3','utils'],function(d3,util){
    
    var ruleCommands = {
        "draw" : function(globalData,values){
            if(globalData.shell.cwd.tags.type === "rule"){
                drawRule(globalData);
            }else{
                console.warn("Not a rule");
            }
        },
        "cleanup" : function(globalData, values){
            d3.select("#mainContainer").selectAll(".condition").remove();
            d3.select("#mainContainer").selectAll(".action").remove();
            d3.select("#mainContainer").select(".rule").remove();
            d3.select("#mainContainer").selectAll(".condExpectation").remove();
            d3.select("#mainContainer").selectAll(".actionExpectation").remove();
        },
        //** @command cd
        "cd" : function(globalData,values){
            //switch back to node mode
            var modes = _.keys(globalData.commands);
            if(modes.indexOf('node') !== -1){
                globalData.commands[globalData.currentCommandMode].cleanup(globalData,[]);
                globalData.currentCommandMode = modes[modes.indexOf('node')];
                //execute cd
                var cd = globalData.lookupOrFallBack('cd',globalData);
                cd(globalData,values);
            }
        },
        //** @command new -> addCondition/test/action
        "new" : function(globalData,values){
            var type = values.shift();
            if(type === "condition"){
               globalData.shell.addNode(null,'conditions','condition');
            }else if(type === "action"){
                globalData.shell.addAction(values);
            }else if(type === "test"){
                var target = values.shift();
                while(values.length >= 3){
                    var testParams = values.splice(0,3);
                    globalData.shell.addTest(target,testParams);
                }
            }else if(type === "negCondition"){
                globalData.shell.addNode(null,'conditions','negCondition');
            }else if(type === "negConjCondition"){
                globalData.shell.addNode(null,'conditions','negConjCondition');
            }
        },
        //** @command rm
        "rm" : function(globalData,values){
            //remove action
            if(values[0] === 'action'){
                globalData.shell.removeAction(values.slice(1));
            }
            //condition
            if(values[0] === 'condition'){
                globalData.shell.removeCondition(values.slice(1));
            }                
            //test
            if(values[0] === 'test'){
                //condition number, test number
                globalData.shell.removeTest(values[1],values[2]);
            }
            if(values[0] === 'binding'){
                globalData.shell.removeBinding(values[1],values[2]);
            }
        },
        //** @command set
        //set action 0 actionType
        //set action 0 a #b
        //set action 0 a 5
        "set" : function(globalData,values){
            //set actiontype
            if(values[0] === 'actionType' && !isNaN(Number(values[1]))){
                //set actionType 0 assert 
                globalData.shell.setActionType(Number(values[1]),values[2]);
            }
            //action value
            if(values[0] === "actionValue"){
                globalData.shell.setActionValue(Number(values[1]),values[2],values[3]);
            }
            //action arithmetic
            //set arith 0 a + 6
            if(values[0] === 'arith'){
                globalData.shell.setArithmetic(values[1],values[2],values[3],values[4]);
            }                
            //set test value
            if(values[0] === 'test'){
                globalData.shell.setTest(values[1],values[2],values[3],values[4],values[5]);
            }                
            //binding
            if(values[0] === 'binding'){
                globalData.shell.setBinding(values[1],values[2],values[3]);
            }                
        },
        //** @command rename
        "rename" : function(globalData,values){
            globalData.shell.rename(values[0]);
        },
        "infer" : function(globalData,values){
            globalData.shell.extractFactPrototypes();
        },
        //link a condition or action with an expected node
        "link" : function(globalData,values){
            //get the condition/action being targeted
            var condOrAction = globalData.shell.allNodes[values.shift()];
            //get the node being linked
            var nodeToLink = globalData.shell.allNodes[values.shift()];

            if(condOrAction === undefined || condOrAction.expectationNode === undefined){
                throw new Error("Linking needs a valid node to hold expectation");
            }
            if(nodeToLink === undefined){
                throw new Error("Linking needs a valid node to expect");
            }
            //if you are overwriting an expectation:
            //remove the old expectation
            if(condOrAction.expectationNode !== null){
                var oldExpectation = globalData.shell.allNodes[condOrAction.expectationNode];
                if(condOrAction.tags.type === "condition"){
                    delete oldExpectation.expectedBy[condOrAction.id];
                }else if(condOrAction.tags.type === "action"){
                    delete oldExpectation.producedBy[condOrAction.id];
                }
            }
            //assign it to the expectation node
            condOrAction.expectationNode = nodeToLink.id;
            //store the expectation in the node
            if(condOrAction.tags.type === "condition"){
                nodeToLink.expectedBy[condOrAction.id] = condOrAction.name;
            }else if(condOrActiontags.type === "action"){
                nodeToLink.producedBy[condOrAction.id] = condOrAction.name;
            };
            
        },        
        "help" : function(globalData,values){
            return {
                "help#general" : [ "", "Display General Commands Help"],
                "cd"    : [ "[.. | $name | $id]", "Move to other nodes. Reverts to node mode"],
                "new condition" : [ " ", " Create a new condition for the current rule. (IF)"],
                "new negCondtion" : ["", "Create a negative condition"],
                "new negConjCondition" : ["","Create a Negated Conjunctive Condition"],
                "new action" : [ "$name+", " Create a new action for the current rule. (THEN)"],
                "new test" : [ "$num $field $op $value", " Create a constant test for the condition id'd."],
                "rm"     : [ "[condition | action] $id", " Remove a condition/action/test"],
                "rm test" : ["$conditionId $testId", "Remove the test from the condition"],
                "rm binding" : ["$conditionId $boundVarName", "Remove a binding from a condition"],
                "set"    : [ "[binding | arith | actionValue | actionType | test] [values]", " Set values of conditions/actions"],
                "rename" : ["", " Rename the rule"],
                "link"   : ["$conditionOrActionId $nodeId", "Link a condition or action with the node in the graph it tests or produces"],
            };
        },
    };

    //--------------------
    //utils:

    //draw a set of condtions or actions
    //conditions need to draw tests and bindings, negative status, or conditions
    //actions need to draw
    var drawGroup = function(globalData,container,className,data,xLocation,groupWidth,heightOfNode){
        //console.log("drawing:",data);
        var animationLength = 100;
        var boundGroup = container.selectAll("."+className)
            .data(data,function(d,i){ return d.id; });

        //exit selection
        boundGroup.exit().selectAll("rect")
            .transition()
            .duration(animationLength)
            .style("fill","red");

        boundGroup.exit().selectAll("text").transition()
            .style("opacity",0);
        
        boundGroup.exit().transition().delay(animationLength).remove();

        //entry selection
        var entryGroup = boundGroup.enter().append("g")
            .classed(className, true)
            .attr("transform","translate(" + xLocation + ",100)");


        //create
        entryGroup.append("rect")
            .classed("groupRect",true)
            .attr("width",0)
            .attr("height",0)
            .style("fill",globalData.colours.lightBlue)
            .style("opacity",0)
            .attr("rx",0)
            .attr("ry",0);
       

        entryGroup.append("text")
            .classed("groupText",true)
            .style("text-anchor","middle")
            .style("fill","white")
            .style("opacity",0);


        //update selection
        //transition to updated sizes etc
        boundGroup.transition().delay(animationLength).attr("transform",function(d,i){
                return "translate(" + xLocation + "," + (100 + (i * (heightOfNode + 20))) + ")";
        });
        
        boundGroup.selectAll(".groupText")
            .attr("transform","translate(" + (groupWidth * 0.5) + "," +
                  (15) + ")");

        
        boundGroup.selectAll(".groupRect")
            .transition().delay(animationLength*3).duration(animationLength)
            .attr("width",groupWidth)
            .attr("height",heightOfNode)
            .attr("rx",10)
            .attr("ry",10)
            .style("opacity",1);

        boundGroup.selectAll(".groupText").transition().delay(animationLength*3).duration(animationLength)
            .text(function(d){ return d.id + " : " + d.name; })
            .style("opacity",1);
        
        return boundGroup;
    };

    /**
       @function drawRule
       @purpose draws a rule
     */
    var drawRule = function(globalData){
        //console.log("Drawing rule");
        var colWidth = globalData.calcWidth(globalData.usableWidth,5);
        var halfWidth = globalData.halfWidth();
        //get the data:
        var cwdData = globalData.shell.cwd;
        var nodeText = globalData.shell.getListsFromNode(cwdData,['id','name','values','tags','annotations']);
        var ruleTextHeight = 20;
        var ruleTextSeparator = 2;
        var conditionData, actionData, conditionExpectData, actionExpectData;
        //Get the condtion nodes
        conditionData = _.keys(cwdData.conditions).map(toNodes.bind(globalData.shell)) || [];

        //get the action nodes
        actionData = _.keys(cwdData.actions).map(toNodes.bind(globalData.shell)) || [];
        
        //get the conditionExpect Nodes
        conditionExpectData = conditionData.map(function(cond){
            if(cond.expectationNode !== null){
                return this.allNodes[cond.expectationNode];
            }else{
                return {id: cond.id, name: "Non-Node" };
            }
        },globalData.shell);

        //get the actionExpect Nodes
        actionExpectData = actionData.map(function(action){
            if(action.expectationNode !== null){
                return this.allNodes[action.expectationNode];
            }else{
                return {id: action.id, name: "Non-Node"};
            }
        },globalData.shell);
        
        //container
        var mainContainer = util.selectOrShare("mainContainer",undefined,d3);
        
        //draw rule actual
        var rule = mainContainer.selectAll(".rule").data([cwdData],function(d){
            return d.id;
        });
        
        rule.exit().remove();
        
        rule.enter().append("g").classed("rule",true)
            .attr("transform","translate(" + halfWidth + ",100)");
        rule.append("rect")
            .classed("ruleRect",true)
            .attr("transform","translate(" + (- (colWidth * 0.5)) + ",0)")
            .style("fill",globalData.colours.darkBlue)
            .attr("rx",0).attr("ry",0)
            .transition()
            .attr("rx",10).attr("ry",10);
        
        
        
        rule.selectAll(".ruleText").remove();
        var boundText = rule.selectAll(".ruleText").data(nodeText);

        var enter = boundText.enter().append("g").classed("ruleText",true);

        enter.each(function(d,i){
                if(d.length === 0) return;
                
                d3.select(this).append("rect")
                    .attr("width",(colWidth * 0.8))
                    .attr("height",(ruleTextHeight))
                    .style("fill",globalData.colours.darkerBlue);

                d3.select(this).append("text").classed("ruleTextActual",true)
                    .style("text-anchor","middle")
                    .style("fill",globalData.colours.textBlue)
                .attr("transform","translate(" + (colWidth * 0.4) + "," + (ruleTextHeight * 0.75) + ")");
        });

        //update
        rule.selectAll(".ruleText").attr("transform",function(d,i){
            return "translate(" + (colWidth * -0.4) + "," + (15 + (i * (ruleTextHeight + ruleTextSeparator))) + ")";
        });
        
        rule.selectAll(".ruleTextActual")
            .text(function(d){
                return d;
            });

        rule.selectAll(".ruleRect")
            .attr("width",colWidth).attr("height",(nodeText.length * (ruleTextHeight + ruleTextSeparator) + 30));
        
        //Calculate sizes:
        var amtOfSpace = (globalData.usableHeight - 100);
        var separatorSpace = 20;
        var conditionNodeHeight = util.calculateNodeHeight(amtOfSpace,separatorSpace,conditionData.length);
        var actionNodeHeight = util.calculateNodeHeight(amtOfSpace,separatorSpace,actionData.length);
        
        //draw conditions
        var conditions = drawGroup(globalData,mainContainer,"condition",conditionData,(halfWidth - (colWidth * 2)), colWidth,conditionNodeHeight);
        //Annotate conditions:
        annotateConditions(globalData,conditions,colWidth, conditionNodeHeight);
        
        //draw actions
        var actions = drawGroup(globalData,mainContainer,"action",actionData,(halfWidth + colWidth), colWidth,actionNodeHeight);
        //annotate actions:
        annotateActions(globalData,actions,colWidth,actionNodeHeight);
        
        //draw expectations:
        var conditionExpectations = drawGroup(globalData,mainContainer,"condExpectation",conditionExpectData,(halfWidth - (colWidth * 3) - 10),colWidth,conditionNodeHeight);

        var actionExpectations = drawGroup(globalData,mainContainer,"actionExpectation",actionExpectData,(halfWidth + (colWidth * 2) + 10),colWidth,actionNodeHeight);
        
    };

    /**
       @function drawConditions
       @purpose Add condition specific nodes to a selection
     */
    var annotateConditions = function(globalData,existingSelection,nodeWidth,heightOfNode){
        //console.log("Annotating Conditions");
        //add details to each element of the selection, to describe it as a condition
        var separator = 5;
        existingSelection.each(function(d,i){
            //get the data
            var tests = _.keys(d.constantTests).map(function(g){
                return globalData.shell.allNodes[g];
            });
            var bindings = _.pairs(d.bindings);
            //todo: get negative || negConj
            //if negConj: draw sub conditions, and annotate them
            //if negative, draw a negative notation

            
            //calculate sizes
            var heightOfInteriorNodes = util.calculateNodeHeight((heightOfNode - (heightOfNode * 0.1 + separator)),separator,tests.length + bindings.length);

            //annotate tests
            var boundTests = d3.select(this).selectAll(".test").data(tests,function(e){ return e.id; });
            
            util.annotate(boundTests,"test",
                          (heightOfNode * 0.1 + separator),
                          heightOfInteriorNodes,separator,
                          10, nodeWidth, "red",
                          function(e,i){
                              return "(" + e.id + "): wme.data." + e.values.field + " "
                                  + util.operatorToString(e.values.operator) + " " + e.values.value;
                          });

            //annotate bindings
            var boundBindings = d3.select(this).selectAll(".binding").data(bindings,function(e){ return e[0]+e[1]; });
            util.annotate(boundBindings,"binding",
                          (heightOfNode * 0.1 + separator + (tests.length * (heightOfInteriorNodes + separator))),
                          heightOfInteriorNodes,separator,
                          10, nodeWidth, "green",
                          function(e,i){
                              return e[0] + " <-- wme.data." + e[1];
                          });
        });
    };
                               
    var annotateActions = function(globalData,existingSelection,nodeWidth,nodeHeight){
        //console.log("Annotating Actions");
        var separator = 5;
        existingSelection.each(function(d,i){
            //get the data
            var actionType = [d.tags.actionType];
            var actionFocus = [d.tags.actionFocus];
            var actionValues = _.pairs(d.values);
            var arithActions = _.pairs(d.arithmeticActions);

            //calculate sizes:
            var totalDataPoints = actionType.length + actionFocus.length
                + actionValues.length + arithActions.length;
            var heightOfInteriorNodes = util.calculateNodeHeight((nodeHeight - (nodeHeight * 0.1 + separator)),separator, totalDataPoints);

            var offset = nodeHeight * 0.1 + separator;
            //annotate each section:
            //actionType:

            var boundActionType = d3.select(this).selectAll(".actionType").data(actionType,function(e){return e;});
            util.annotate(boundActionType,"actionType",
                          offset,
                          heightOfInteriorNodes, separator,
                          10, nodeWidth, "red",
                          function(e,i){ return "ActType: " + e; });

            //actionFocus:
            offset += actionType.length * (heightOfInteriorNodes + separator);
            
            var boundActionFocus = d3.select(this).selectAll(".actionFocus").data(actionFocus,function(e){return e;});
            util.annotate(boundActionFocus,"actionFocus",
                          offset,
                          heightOfInteriorNodes,separator,
                          10, nodeWidth,"orange",
                          function(e,i){ return "ActFocus: " + e; });

            //actionValues:
            offset += actionFocus.length * (heightOfInteriorNodes + separator);
            
            var boundActionValues = d3.select(this).selectAll(".actionValue").data(actionValues,function(e,i) { return e[0] + e[1]; });
            util.annotate(boundActionValues,"actionValue",
                          offset,
                          heightOfInteriorNodes, separator,
                          10, nodeWidth, "yellow",
                          function(e,i){ return e[0] + ": " + e[1]; });
            
            //arithActions:
            offset += actionValues.length * (heightOfInteriorNodes + separator);

            var boundArithActions = d3.select(this).selectAll(".arithAction").data(arithActions,function(e,i){return e[0] + e[1][0] + e[1][1]; });
            util.annotate(boundArithActions,"arithAction",
                          offset,
                          heightOfInteriorNodes,separator,
                          10,nodeWidth,"green",
                          function(e,i){
                              return e[0] + " " + e[1][0] + " " + e[1][1];
                          });
            
        });
    };

    //UtilityMethod. Bind to globalData.shell first
    var toNodes = function(id){
        return this.allNodes[id];
    };

    
    return ruleCommands;

});
