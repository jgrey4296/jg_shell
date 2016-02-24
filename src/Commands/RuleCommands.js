/**
   @file RuleCommands
   @purpose To implement all user commands dealing with rules
*/

define(['d3','utils','underscore','Drawing/RuleDrawing','Drawing/NodeDrawing'],function(d3,util,_,RuleDrawing,NodeDrawing){
    "use strict";
    
    var ruleCommands = {
        "draw" : function(globalData,values){
            if(globalData.shell.cwd.tags.type.toLowerCase() === "rule"){
                RuleDrawing.drawRule(globalData,globalData.shell.cwd);
                //drawRule(globalData);
            }else if(globalData.shell.cwd.tags.type === "negConjCondition"){
                //TODO: draw neg conj condition
                RuleDrawing.drawRule(globalData,globalData.shell.cwd);
                //drawRule(globalData);
            }else{
                //ruleCommands.cleanup();
                //NodeDrawing.drawNode(globalData,globalData.shell.cwd);
            }
        },
        "cleanup" : function(globalData, values){
            RuleDrawing.cleanup();
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

            if(targetType === 'action' && targetField === 'timing'){
                globalData.shell.setTiming(Number(targetId),values[0],values[1],sourceId);
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
                var oldExpectation = globalData.shell.getNode(condOrAction.expectationNode);
                if(oldExpectation && condOrAction.tags.type === "condition"){
                    delete oldExpectation.expectedBy[condOrAction.id];
                }else if(oldExpectation && condOrAction.tags.type === "action"){
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
                "set action" : ["$id regex $varname $regex $options $replaceVal", ""],
                //todo: explain setting action data/arith/regex
            };
        },
    };

    //--------------------
    return ruleCommands;

});
