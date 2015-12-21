/**
   @file RuleCommands
   @purpose To implement all user commands dealing with rules
*/

define(['d3','utils'],function(d3,util){
    
    var ruleCommands = {
        "draw" : function(globalData,values){
            if(globalData.shell.cwd.tags.type === "rule"){
                drawRule(globalData);
            }else if(globalData.shell.cwd.tags.type === "condition"){
                //todo
            }else if(globalData.shell.cwd.tags.type === "action"){
                //todo
            }else if(globalData.shell.cwd.tags.type === "constantTest"){
                //todo
            }
        },
        "cleanup" : function(globalData, values){
            d3.select("#mainContainer").selectAll(".condition").remove();
            d3.select("#mainContainer").selectAll(".action").remove();
            d3.select("#mainContainer").select(".rule").remove();
        },
        //** @command cd
        "cd" : function(globalData,values){
            globalData.shell.cd(values[0]);
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

        "help" : function(globalData,values){
            return {
                "helpGeneral" : [ "", "Display General Commands Help"],
                "cd"    : [ "[.. | $name | $id]", "Move to other nodes."],
                "new condition" : [ " ", " Create a new condition for the current rule. (IF)"],
                "new action" : [ "$name+", " Create a new action for the current rule. (THEN)"],
                "new test" : [ "$num $field $op $value", " Create a constant test for the condition id'd."],
                "rm"     : [ "[condition | action] $id", " Remove a condition/action/test"],
                "set"    : [ "[binding | arith | actionValue | actionType | test] [values]", " Set values of conditions/actions"],
                "rename" : ["", " Rename the rule"],
                "add"    : [ "", " ???"],
            };
        },
    };

    //--------------------
    //utils:

    //draw a set of condtions or actions
    //conditions need to draw tests and bindings, negative status, or conditions
    //actions need to draw
    var drawGroup = function(globalData,container,className,data,xLocation,groupWidth,heightOfNode){
        console.log("drawing:",data);
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
            console.log("Drawing rule");
            var colWidth = globalData.calcWidth(globalData.usableWidth,3);
            var halfWidth = globalData.halfWidth();
            //get the data:
            var cwdData = globalData.shell.cwd;
            var nodeText = globalData.shell.getListsFromNode(cwdData,['id','name','values','tags','annotations']);
            var conditionData, actionData;
            if(cwdData.conditions){
                conditionData = _.keys(cwdData.conditions).map(function(d){
                    return this.allNodes[d];
                },globalData.shell);
            }else{
                conditionData = [];
            }

            if(cwdData.actions){
                actionData = _.keys(cwdData.actions).map(function(d){
                    return this.allNodes[d];
                },globalData.shell);
            }else{
                actionData = [];
            }

            //container
            var mainContainer = util.selectOrShare("mainContainer");
            
            //draw rule
            var rule = mainContainer.selectAll(".rule").data([cwdData],function(d){
                return d.id;
            });

            rule.exit().remove();

            rule.enter().append("g").classed("rule",true)
                .attr("transform","translate(" + halfWidth + ",100)");
            rule.append("rect")
                .attr("width",colWidth).attr("height",(nodeText.length * 15 + 30))
                .attr("transform","translate(" + (- (colWidth * 0.5)) + ",0)")
                .style("fill",globalData.colours.darkBlue)
                .attr("rx",0).attr("ry",0)
                .transition()
                .attr("rx",10).attr("ry",10);

            rule.selectAll("text").remove();
            var boundText = rule.selectAll("text").data(nodeText);
            boundText.enter().append("text")
                .style("text-anchor","middle")
                .attr("transform",function(d,i){
                    return "translate(0," + (15 + i * 15) + ")";
                })
                .style("fill",globalData.colours.textBlue)
                .text(function(d){
                    return d;
                });

        //Draw the conditions and actions:
        var amtOfSpace = (globalData.usableHeight - 100);
        var separatorSpace = 20;
        var conditionNodeHeight = util.calculateNodeHeight(amtOfSpace,separatorSpace,conditionData.length);
        var actionNodeHeight = util.calculateNodeHeight(amtOfSpace,separatorSpace,actionData.length);
        
        //draw conditions
        var conditions = drawGroup(globalData,mainContainer,"condition",conditionData,(halfWidth - (colWidth * 2)), colWidth,conditionNodeHeight);
        drawConditions(globalData,conditions,colWidth, conditionNodeHeight);
        
            //draw actions
        var actions = drawGroup(globalData,mainContainer,"action",actionData,(halfWidth + colWidth), colWidth,actionNodeHeight);
            //draw nodes the conditions test
            //draw nodes the actions create
    };

    /**
       @function drawConditions
       @purpose Add condition specific nodes to a selection
     */
    var drawConditions = function(globalData,existingSelection,nodeWidth,heightOfNode){
        //Draw tests
        existingSelection.each(function(d,i){
            //get the tests
            var tests = _.keys(d.constantTests).map(function(g){
                return globalData.shell.allNodes[g];
            });
            var separator = 5;
            var heightOfTests = util.calculateNodeHeight((heightOfNode - (heightOfNode * 0.1 + 5)),separator,tests.length);
            //bind them
            var boundTests = d3.select(this).selectAll(".test").data(tests,function(d){return d.id;});

            //exit Selection
            boundTests.exit().remove();
            
            //enter selection
            var newTests = boundTests.enter().append("g").classed("test",true);

            boundTests.attr("transform",function(e,i){
                    return "translate(10,"+ ((heightOfNode * 0.1 + 5) + (i * (heightOfTests + separator))) + ")";
                });

            //create
            newTests.append("rect")
                .classed("conditionRect",true);

            newTests.append("text")
                .classed("testText",true);
            
            boundTests.selectAll(".conditionRect")
                .attr("width",(nodeWidth - 20))
                .attr("height",heightOfTests)
                .style("fill","red")
                .attr("rx",10)
                .attr("ry",10);

            boundTests.selectAll(".testText")
                .text(function(d){
                    return "(" + d.id + "): " + d.values.field + " "
                        + d.values.operator + " " + d.values.value;
                })
                //.style("text-anchor","middle")
                .attr("transform","translate(" + (10)
                      + "," + (heightOfTests * 0.5) + ")");
            
        });
        
        //draw bindings

    };
    
    
    return ruleCommands;

});
