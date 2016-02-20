/**
   @file RuleCommands
   @purpose To implement all user commands dealing with rules
*/

define(['d3','utils','underscore'],function(d3,util,_){
    "use strict";
    
    var ruleCommands = {
        "draw" : function(globalData,values){
            if(globalData.shell.cwd.tags.type.toLowerCase() === "rule"){
                drawRule(globalData);
            }else if(globalData.shell.cwd.tags.type === "negConjCondition"){
                //TODO: draw neg conj condition
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
        "new" : function(globalData,values,sourceId){
            var type = values.shift();
            if(type === "condition"){
                if(values.length > 0 && !isNaN(Number(values[0]))){
                    sourceId = Number(values.shift());
                }
                globalData.shell.addNode(null,'conditions','condition',values,sourceId);
            }else if(type === "action"){
                globalData.shell.addAction(values,sourceId);
            }else if(type === "negCondition"){
                globalData.shell.addNode(null,'conditions','negCondition',values,sourceId);
            }else if(type === "negConjCondition"){
                globalData.shell.addNode(null,'conditions','negConjCondition',values,sourceId);
            }
        },
        //if - a short way to define conditions
        "if" : function(globalData, values,sourceId){
            values = values.map(function(d){
                return d.replace(/,/,"");
            });
            var newCondition = globalData.shell.addNode(null,'conditions','condition',values,sourceId);
            while(values.length >= 3){
                var currentTest = values.splice(0,3);
                globalData.shell.addTest(newCondition.id,currentTest);
            }            
        },
        //** @command rm
        "rm" : function(globalData,values,sourceId){
            //remove action
            if(values[0] === 'action'){
                globalData.shell.removeAction(values.slice(1),sourceId);
            }
            //condition
            if(values[0] === 'condition'){
                globalData.shell.removeCondition(values.slice(1),sourceId);
            }                
        },
        //** @command set
        //set action 0 type assert
        //set condiiton 4 test a EQ 5
        //set condition 4 test 5 a GT 10
        //set condition 5 binding a b
        //set action 0 value a #b
        //set action 0 arith a + 2
        //set rule 3 values a 5
        "set" : function(globalData,values,sourceId){
            var targetType = values.shift(),
                targetId = values.shift(),
                targetField = values.shift();
            //console.log("SET:",targetType,targetId,targetField);

            if(Number.isNaN(Number(targetId)) || globalData.shell.allNodes[Number(targetId)] === undefined){
                throw new Error("Unrecognised targetId");
            }
            
            //Set elements of an action:
            if(targetType === 'action' && targetField === 'type'){
                globalData.shell.setActionType(Number(targetId),values[0],sourceId);
            }

            if(targetType === 'action' && targetField === 'data'){
                globalData.shell.setActionValue(Number(targetId),values[0],values[1],sourceId);
            }
            
            if(targetType === 'action' && targetField === 'arith'){
                globalData.shell.setArithmetic(Number(targetId),values[0],values[1],values[2],sourceId);
            }

            if(targetType === 'action' && targetField === 'regex'){
                globalData.shell.setRegex(Number(targetId),values[0],values[1],sourceId);
            }
            
            //todo: set action tags
            
            //Set binding of a condition:
            //ie: set condition n binding a b
            //desired: set condition n binding a b (NE otherBinding, GT otherBinding2...)
            if(targetType === 'condition' && targetField === 'binding'){
                if(values.length >= 2){
                    var boundName = values.shift(),
                        dataName = values.shift(),
                        bindingTests = [];
                    while(values.length > 0){
                        var a = values.shift(),
                            b = values.shift();
                        bindingTests.push([a,b]);                        
                    }
                    
                    globalData.shell.setBinding(Number(targetId),boundName,dataName,bindingTests,sourceId);
                }else if(values.length === 1){
                    globalData.shell.removeBinding(Number(targetId),values[0],sourceId);
                }
            }

            //create or set a test
            if(targetType === 'condition' && targetField === 'test'){
                //if test is specified and exists:
                if(values.length === 4){
                    globalData.shell.setTest(Number(targetId),Number(values[0]),values[1],values[2],values[3],sourceId);
                    //otherwise if creating a new test:
                }else if(values.length === 3){
                    globalData.shell.addTest(Number(targetId),values,sourceId);
                }else if(values.length === 1){
                    globalData.shell.removeTest(Number(targetId),Number(values[0]),sourceId);
                }
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
            //currently not used, but the syntax is more pleasing if included
            var targetType = values.shift(),
            //get the condition/action being targeted
                condOrAction = globalData.shell.getNode(values.shift()),
            //get the node being linked
                nodeToLink = globalData.shell.getNode(values.shift());

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
            }else if(condOrAction.tags.type === "action"){
                nodeToLink.producedBy[condOrAction.id] = condOrAction.name;
            }
            
        },        
        "help" : function(globalData,values){
            return {
                "help#general" : [ "", "Display General Commands Help"],
                "cd"    : [ "[.. | $name | $id]", "Move to other nodes. Reverts to node mode"],
                "new condition" : [ " ", " Create a new condition for the current rule. (IF)"],
                "new negCondtion" : ["", "Create a negative condition"],
                "new negConjCondition" : ["","Create a Negated Conjunctive Condition"],
                "new action" : [ "$name+", " Create a new action for the current rule. (THEN)"],
                "rm"     : [ "[condition | action] $id", " Remove a condition/action/test"],
                "set" : ["$targetType $targetId $targetFocus $values", "ie: set condition 5 binding a b"],
                "rename" : ["", " Rename the rule"],
                "link"   : ["$target $conditionOrActionId $nodeId", "Link a condition or action with the node in the graph it tests or produces"],
                "set" : ["action $id regex $varname $regex $options $replaceVal", ""],
                //todo: explain setting action data/arith/regex
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
            //.attr("dy","1.4em");


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
            .text(function(d){
                if(d.id === undefined){
                    return "Undefined";
                }else{
                    return d.id + " : " + d.name;
                }})
            .style("opacity",1);

        //util.wrapText([d3.select(this),(groupWidth * 0.8),d3);

        
        return boundGroup;
    };

    /**
       @function drawRule
       @purpose draws a rule
     */
    var drawRule = function(globalData){
        //console.log("Drawing rule");
        var colWidth = globalData.calcWidth(globalData.usableWidth,5),
            halfWidth = globalData.halfWidth(),
        //get the data:
            cwdData = globalData.shell.cwd,
            nodeText = globalData.shell.getListsFromNode(cwdData,['id','name','values','tags','annotations']),
            ruleTextHeight = 20,
            ruleTextSeparator = 2,
            conditionData, actionData, conditionExpectData, actionExpectData;
        //end of vars

        
        //Get the condtion nodes
        conditionData = _.keys(cwdData.conditions).map(toNode.bind(globalData.shell)) || [];
        //console.log("Condition Data:",conditionData);
        //get the action nodes
        actionData = _.keys(cwdData.actions).map(toNode.bind(globalData.shell)) || [];
        
        //get the conditionExpect Nodes
        conditionExpectData = conditionData.map(function(cond){
            if(cond.expectationNode !== null && cond.expectationNode !== undefined){
                return this.allNodes[cond.expectationNode];
            }else{
                return {id: undefined, name: "No Linked Node" };
            }
        },globalData.shell);

        //get the actionExpect Nodes
        actionExpectData = actionData.map(function(action){
            if(action.expectationNode !== null && action.expectationNode !== undefined){
                return this.allNodes[action.expectationNode];
            }else{
                return {id: undefined, name: "No Linked Node"};
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
            if(d.length === 0) { return; }
                
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
        var amtOfSpace = (globalData.usableHeight - 100),
            separatorSpace = 20,
            conditionNodeHeight = util.calculateNodeHeight(amtOfSpace,separatorSpace,conditionData.length),
            actionNodeHeight = util.calculateNodeHeight(amtOfSpace,separatorSpace,actionData.length);
        
        //draw conditions
        var conditions = drawGroup(globalData,mainContainer,"condition",conditionData,(halfWidth - (colWidth * 2)), colWidth + 40,conditionNodeHeight);
        //Annotate conditions:
        annotateConditions(globalData,conditions,colWidth + 40, conditionNodeHeight);
        
        //draw actions
        var actions = drawGroup(globalData,mainContainer,"action",actionData,(halfWidth + colWidth - 40), colWidth + 40,actionNodeHeight);
        //annotate actions:
        annotateActions(globalData,actions,colWidth + 40,actionNodeHeight);
        
        //draw expectations:
        if(conditionExpectData.length > 0){
            var conditionExpectations = drawGroup(globalData,mainContainer,"condExpectation",conditionExpectData,(halfWidth - (colWidth * 3) - 10),colWidth,conditionNodeHeight);
        }
        if(actionExpectData.length > 0){
            //console.log("Drawing action expectations");
            var actionExpectations = drawGroup(globalData,mainContainer,"actionExpectation",actionExpectData,(halfWidth + (colWidth * 2) + 10),colWidth,actionNodeHeight);
        }
        
    };

    /**
       @function annotateConditions
       @purpose Add condition specific nodes to a selection
     */
    var annotateConditions = function(globalData,existingSelection,nodeWidth,heightOfNode){
        //console.log("Annotating Conditions");
        //add details to each element of the selection, to describe it as a condition
        var separator = 5,
            idRegex = new RegExp(/^[#\$]id/);

        
        existingSelection.each(function(d,i){
            //get the data
            console.log(d);
            //Get the tests and bindings:
            var tests = d.constantTests.length > 0  ? _.clone(d.constantTests) : ["No Tests"],
                bindings = _.keys(d.bindings).length !== 0 ? _.pairs(d.bindings) : ["No Bindings"],
                //calculate sizes
                heightOfInteriorNodes = util.calculateNodeHeight((heightOfNode - (heightOfNode * 0.1 + separator)),separator,tests.length + bindings.length);
            
            //copy over a numeric identifier:
            tests.forEach(function(e,f){
                e.i = f;
            });
            
            //todo: get negative || negConj
            //if negConj: draw sub conditions, and annotate them
            //if negative, draw a negative notation
            
            console.log("Binding tests:",tests);
            //annotate tests
            //d3.select(this).selectAll(".test").remove();
            var boundTests = d3.select(this).selectAll(".test").data(tests,function(e,f){
                return `${e.field} ${e.operator} ${e.value}`;
            }),
                textsOfTests = util.annotate(boundTests,"test",
                                           (heightOfNode * 0.1 + separator),
                                           heightOfInteriorNodes,separator,
                                           10, nodeWidth, globalData.colours.darkerBlue,
                                             function(e,f){
                                                 console.log("Drawing test:",e);
                                                 if(e === "No Tests") { return e; }
                                                 return "(" + e.i + "): wme.data." + e.field + " "  + util.operatorToString(e.operator) + " " + e.value;
                                           },globalData.textBlue),
                //annotate texts
                boundBindings = d3.select(this).selectAll(".binding").data(bindings,function(e){ return e[0]+e[1]; }),
                textsOfBindings = util.annotate(boundBindings,"binding",
                                             (heightOfNode * 0.1 + separator + (tests.length * (heightOfInteriorNodes + separator))),
                                             heightOfInteriorNodes,separator,
                                             10, nodeWidth, globalData.colours.grey,
                                                function(e,i){
                                                    if(e === "No Bindings") { return e; }
                                                 var retString = e[0] + " <-- wme";
                                                 retString += idRegex.test(e[1][0]) ? ".id" : ".data." + e[1][0];
                                                 retString += e[1][1].length > 0 ? " :: " + e[1][1].map(function(e){
                                                     return util.operatorToString(e[0]) + " " + e[1];
                                                 }).join(",") : "";
                                                 return retString;
                                             });

            //Wrap the texts if necessary
            util.wrapText(textsOfTests,(nodeWidth * 0.8),d3);
            util.wrapText(textsOfBindings,(nodeWidth * 0.8),d3);
            
        });
    };

    /**
       @function annotateActions
       @purpose Annotate actions similar to annotating conditions
     */
    var annotateActions = function(globalData,existingSelection,nodeWidth,nodeHeight){
        //console.log("Annotating Actions");
        var separator = 5;
        
        existingSelection.each(function(d,i){
            //get the data
            var actionType = [d.tags.actionType],
                actionValues = _.pairs(d.values),
                arithActions = _.pairs(d.arithmeticActions),
                regexActions = _.pairs(d.regexActions),
                offset = nodeHeight * 0.1 + separator;

            //TODO: flatten values, arith, and regex's into single nodes?
            //OR: At least group them by the variable being operated on
            
            //Add empty notations for values, arith, and regex:
            if(actionValues.length === 0){
                actionValues.push(["Action Data","Empty"]);
            }
            if(arithActions.length === 0){
                arithActions.push(["Arithmetic Actions",["Empty",""]]);
            }
            if(regexActions.length === 0){
                regexActions.push(["Regex Actions Empty",["","",""]]);
            }
            
            //calculate sizes:
            var totalDataPoints = actionType.length + actionValues.length + arithActions.length + regexActions.length,
                heightOfInteriorNodes = util.calculateNodeHeight((nodeHeight - (nodeHeight * 0.1 + separator)),separator, totalDataPoints);

            

            //actionType:
            var boundActionType = d3.select(this).selectAll(".actionType").data(actionType,function(e){return e;}),
                actionTypeText = util.annotate(boundActionType,"actionType",
                                               offset,
                                               heightOfInteriorNodes, separator,
                                               10, nodeWidth, globalData.colours.textGrey,
                                               function(e,i){ return "Type: " + e; });
            
            //actionValues:
            offset += actionType.length * (heightOfInteriorNodes + separator);
            
            var boundActionValues = d3.select(this).selectAll(".actionValue").data(actionValues,function(e,i) { return e[0] + e[1]; }),
                actionValueTexts = util.annotate(boundActionValues,"actionValue",
                                                 offset,
                                                 heightOfInteriorNodes, separator,
                                                 10, nodeWidth, globalData.colours.darkerBlue,
                                                 function(e,i){
                                                     return e[0] + ": " + e[1];
                                                 });
            
            //arithActions:
            offset += actionValues.length * (heightOfInteriorNodes + separator);

            //arith is stored as [var, [op,value]]
            var boundArithActions = d3.select(this).selectAll(".arithAction").data(arithActions,function(e,i){return e[0] + e[1][0] + e[1][1]; }),
                boundArithTexts = util.annotate(boundArithActions,"arithAction",
                                                offset,
                                                heightOfInteriorNodes,separator,
                                                10,nodeWidth,globalData.colours.grey,
                                                function(e,i){
                                                    return e[0] + " " + e[1][0] + " " + e[1][1];
                                                });

            //Regex Actions:
            offset += arithActions.length * (heightOfInteriorNodes + separator);

            //regex is stored as [var,[regex,options,replaceValue]]
            var boundRegexActions = d3.select(this).selectAll(".regexAction").data(regexActions,function(e,i){ return e[0] + e[1][0]+ e[1][2] + e[1][1]; }),
                boundRegexTexts = util.annotate(boundRegexActions,"regexAction",
                                                offset,
                                                heightOfInteriorNodes,separator,
                                                10,nodeWidth,globalData.colours.regexAction,
                                                function(e,i){
                                                        return `${e[0]} ~= /${e[1][0]}/${e[1][2]}/${e[1][1]}`;
                                                });
            
            //Wrap Texts if necessary:
            util.wrapText(actionTypeText,(nodeWidth * 0.8),d3);
            util.wrapText(actionValueTexts,(nodeWidth * 0.8),d3);            
            util.wrapText(boundArithTexts,(nodeWidth * 0.8),d3);
            util.wrapText(boundRegexTexts,(nodeWidth * 0.8),d3);
            
        });
    };

    //UtilityMethod. Bind to globalData.shell first
    var toNode = function(id){
        return this.allNodes[id];
    };

    
    return ruleCommands;

});
