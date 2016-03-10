/* jshint esversion : 6 */
define(['d3','utils','underscore','Drawing/RuleDrawing','Drawing/NodeDrawing'],function(d3,util,_,RuleDrawing,NodeDrawing){
    "use strict";

    /**
     To implement all user commands dealing with rules
     @exports Commands/RuleCommands
     @implements module:Commands/CommandTemplate
     */
    var ruleCommands = {
        /** draw 
            @param globalData
            @param values
        */
        "draw" : function(globalData,values){
            if(globalData.shell.cwd.tags.type.toLowerCase() === "rule"){
                RuleDrawing.drawRule(globalData,globalData.shell.cwd);
            }else if(globalData.shell.cwd.tags.conditionType === "negConjCondition"){
                //TODO: draw neg conj condition
                RuleDrawing.drawRule(globalData,globalData.shell.cwd);
            }else{
                //ruleCommands.cleanup();
                //NodeDrawing.drawNode(globalData,globalData.shell.cwd);
            }
        },
        /** cleanup 
            @param globalData
            @param values
        */
        "cleanup" : function(globalData, values){
            RuleDrawing.cleanup();
        },
        /** Change directory / working node
            @param globalData
            @param values
        */
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
        /** new -> addCondition/test/action 
            @param globalData
            @param values
        */
        "new" : function(globalData,values,sourceId){
            var type = values.shift();
            if(type === "condition"){
                if(values.length > 0 && !isNaN(Number(values[0]))){
                    sourceId = Number(values.shift());
                }
                globalData.shell.addNode(null,'conditions','condition',values,sourceId);
            }else if(type === "action"){
                globalData.shell.addNode(null,'actions','action',values,sourceId);
            }else if(type === "negCondition"){
                let newNode = globalData.shell.addNode(null,'conditions','condition',values,sourceId);
                newNode.setConditionType('negative');
            }else if(type === "negConjCondition"){
                let newNode = globalData.shell.addNode(null,'conditions','condition',values,sourceId);
                newNode.setConditionType('negConjCondition');
            }
        },
        /** if - a short way to define conditions 
            @param globalData
            @param values
        */
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
        /** Remove a node
            @param globalData
            @param values
        */
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
        /** Set a value of a condition/action 
            @param globalData
            @param values
        */
        "set" : function(globalData,values,sourceId){
            //set action 0 type assert
            //set condiiton 4 test a EQ 5
            //set condition 4 test 5 a GT 10
            //set condition 5 binding a b
            //set action 0 value a #b
            //set action 0 arith a + 2
            //set rule 3 values a 5
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

            if(targetType === "action" && targetField === "priority"){
                globalData.shell.setPriority(Number(targetId),values[0],sourceId);
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
        /** infer ?
            @param globalData
            @param values
        */
        "infer" : function(globalData,values){
            globalData.shell.extractFactPrototypes();
        },
        /** Link a Condition/Action with a node in the graph 
            @param globalData
            @param values
        */
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
        /** help 
            @param globalData
            @param values
        */
        "help" : function(globalData,values){
            return {
                "cd" : ["$nodeId","Switch to node mode, and move to the specified node"],
                "new" : ["[condition,action,negCondition,negConjCondition]","Create a new condition or action for the current rule"],
                "if" : ["(test), (test)...","Create a new condition, automatically with the specified tests. ie: if a EQ 5, b GT 10, c LT 15"],
                "rm" : ["[action,condition] $nodeId","Remove a condition or action from the rule"],
                "set" : ["[condition,action] $nodeId $targetField (values)...","Set the relevant condition or actions field with the values specified."],
                "set action $actionId type" : ["$value","Set the action's performance type"],
                "set action $actionId data" : ["$parameter $value", "Set or delete the action.data[parameter] to $value. Value can be a $binding"],
                "set action $actionId arith" : ["$var $operator $value","Set a variable (defined in data) arithmetic operation. Can be $bound"],
                "set action $actionId regex" : ["$var $regex","Set the action's regex action for the $var. regex is of the form /a/A/g"],
                "set action $actionId timing" : ["$timingVar $value", "Set an actions invalidate/perform/unperform offset value"],
                "set action $actionId priority" : ["$value","Set an actions priority"],
                "set condition $conditionId test" : ["$testId? $field $operator $value","Set,create,or remove a condition's test."],
                "set condition $conditionId binding" : ["$bindVar $sourceParam $test $test $test","Set or delete a conditions binding for a variable name, with optional tests to apply to the binding"],
                "rename" : ["$name","Rename the rule"],
                "link" : ["[condition/action] $id $targetId","Specify the target that a condition consumes, or action produces"],
            };
        },
    };

    //--------------------
    return ruleCommands;

});
