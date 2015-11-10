/**
   @file webMain
   @purpose Defines the web interface, and drawing methods, for the shell
*/

//Setup requirejs
require.config({
    baseUrl: "/",
    paths:{
        "../libs/underscore": "/libs/underscore",
        underscore : "libs/underscore",
        ReteDataStructures : 'src/ReteDataStructures',
        ReteProcedures     : "src/ReteProcedures",
        ReteComparisonOperators : "src/ReteComparisonOperators",
        ReteActions : "src/ReteActions",
        ReteArithmeticActions : "src/ReteArithmeticActions",
        GraphNode : "src/GraphNode",
        GraphStructureConstructors:"src/GraphStructureConstructors",
        NodeCommands : "src/NodeCommands",
        RuleCommands : "src/RuleCommands",
        ReteCommands : "src/ReteCommands",
        utils : "src/utils",
        d3 : "libs/d3.min",
        TotalShell : "src/TotalShell",
    },
    shim:{
        underscore :{
            exports:'_'
        },
    }
});

/**
   @require [d3,TotalShell,underscore,NodeCommands,RuleCommands,ReteCommands,utils]
   @purpose The main web program. Creates a shell, visualises it, and listens for user input
*/
require(['d3','TotalShell','underscore',"NodeCommands","RuleCommands","ReteCommands","utils"],function(d3,Shell,_,NodeCommands,RuleCommands,ReteCommands,utils){
    try{//A Top Level Try catch block:
        console.log("Starting Total Authoring Shell");
        if(Shell === undefined) throw new Error("Shell is undefined");

        //----------------------------------------
        //GLOBALS
        //----------------------------------------
        var lastSetOfSearchResults = [];
        //COLOURS:
        var scaleToColour = d3.scale.linear()
            .range([0,20])
            .domain([0,20]);
        var colourScale = d3.scale.category20b();
        
        //The simulated shell:
        var theShell = new Shell.CompleteShell();

        if(theShell === undefined){
            throw new Error("Shell is undefined");
        }
        
        //----------------------------------------
        //COMMAND SECTION
        //----------------------------------------
        //Maps typed commands to methods on shell, in different modes
        console.log("Setting up commands");
        
        /**
           @data commands
           @purpose Object that stores all actions a user can perform
         */
        var commands = {
            "node" : NodeCommands,
            "rule" : RuleCommands,
            //called after every command to update the view
            "context": function(sh,values){
                //draw main columns and nodes
                draw(sh.cwd);
                //draw additional elements:
                drawActivatedRules(sh.reteNet.activatedRules,columnWidth);
                drawStash(sh._nodeStash);
                drawSearchColumn(sh.lastSearchResults,columnWidth);
            },
            //Load a file from the server
            "load" : function(sh,values){
                var request = new XMLHttpRequest();
                request.onreadystatechange=function(){
                    if(request.readyState===4){
                        try{
                            var receivedJson = JSON.parse(request.responseText);
                            console.log("Received JSON:",receivedJson);
                            sh.importJson(receivedJson);
                            commands.context(theShell);
                        }catch(err){
                            alert("Error loading data: \n" + err.message);
                            console.log("Error loading data:",err);
                        }
                    }
                };
                request.open("GET","/data/"+values[0]+".json",true);
                request.send();
            },
            //Save the current graph to the server
            "save" : function(sh,values){
                console.log("Saving:",values);
                var request = new XMLHttpRequest();
                request.onreadystatechange=function(){
                    if (request.readyState===4){
                        console.log("Finished");
                        console.log(request.responseText);
                    }
                };
                request.open("POST","saveData="+values[0],true);
                request.send(sh.exportJson());
            },
        };

        //Import rete commands into root level of general:
        _.keys(ReteCommands).forEach(function(d){
            this[d] = ReteCommands[d];
        },commands);


        //** @data helpData @purpose For displaying reference of commands
        var helpData = {
            node : {
                "new"   : "$target $type $name",
                "nc"    : "[n | i | r | a | rc] $name",
                "np"    : "[n | i | r | a | rc] $name",
                "[ncn | nci]" : "$name",
                "rm"    : "$id",
                "cd"    : "[.. | $name | $id]",
                "rename": "$name",
                "set"   : "$field $parameter $value",
                "link"  : "$target $id",
                "linkr" : "$target $id",
                "stash" : "",
                "unstash":"",
                "top"   : "",
                "prev"  : "",
                "search" : "$target $pattern $focusType",
            },
            rule : {
                "cd"    : "[.. | $name | $id]",
                "new condition" : " ",
                "new action" : "$type $focus",
                "new test" : "$num $field $op $value",
                "new binding" : "$bind $source",
                "rm"     : "",
                "set"    : "",
                "rename" :"",
                "add"    : "",
                

            },
            rete: {
                "assert": "",
                "compile" : "",
                "clear" : "[complete]",
            },
        };


        
        //Utility functions:
        var HalfWidth = function(){
            return (window.innerWidth - 10) * 0.5;
        };
        var HalfHeight = function(){
            return (window.innerHeight - 30) * 0.5;
        };

        //----------------------------------------
        //DRAWING VARIABLES SECTION
        //----------------------------------------
        console.log("Initialising Drawing variables");
        //The y offset for rectangles so they
        //arent at the very top of the screen
        var drawOffset = 50;
        //The height of the bottom supplemental columns
        var supplementalHeight = 300;
        var supplementalWidth = 200;
        var usableWidth = window.innerWidth - 30;
        var usableHeight = window.innerHeight - 30;
        //The columns for the different modes:
        var columnNames = {
            "node" : ["Parents","ShellNode","Children"],
            "rule" : ["parents","conditions","rule","actions","children"]
        };
        var currentCommandMode = "node";
        //the column objects, to be created per mode
            var columns = {};
            var columnWidth = 200;

        
        var calcWidth = function(availableWidth,noOfColumns){
            return (availableWidth / (noOfColumns + 2));
        };

        var columnPosition = function(oneColWidth,columnNumber){
            return oneColWidth + (oneColWidth * columnNumber);
        };

        var getColumnObject = function(columnName){
            if(columns[columnName] === undefined){
                console.log("Available columns:",columns);
                throw new Error("Unrecognised column name:" + columnName);
            }
            return columns[columnName];
        };


        //helper function to setup a column:        
        var initColumn = function(name,columnNumber,columnWidth){
            var newColumn = svg.append("g").attr("id",name)
                .attr("transform","translate(" +
                      columnPosition(columnWidth,columnNumber) + ",0)");

            //display a title for the column
            newColumn.append("text").text(name)
                .style("text-anchor","middle")
                .attr("transform","translate("+ (columnWidth * 0.5)+",40)");

            //display the column as a rectangle
            newColumn.append("rect")
                .attr("width",columnWidth-20)
                .attr("height",window.innerHeight - 200)
                .style("opacity",0.5)
                .attr("rx",10)
                .attr("ry",10)
                .attr("transform","translate(10,"+drawOffset+")");
            return newColumn;
        };

        
        //----------------------------------------
        //DISPLAY FUNCTIONS SECTION
        //----------------------------------------

        /**
           @function displayHelp
           @purpose Draw a help window, and display the help text for commands
         */
        var displayHelp = function(columnWidth,helpDataSubGrammar){
            //console.log(columnWidth + ":Available Commands:", helpDataSubGrammar);
            var helpText = ["Available Commands"].concat(_.keys(helpDataSubGrammar).map(function(d){
                return d + " " + helpDataSubGrammar[d];
            }));

            //console.log("Help Text:",helpText);
            if(columnWidth === undefined){
                console.warn("No columnWidth provided to displayHelp, assuming 200");
                columnWidth = 200;
            }
            var helpSize = 400;
            var helpWindow = d3.select("#helpWindow");
            if(helpWindow.empty()){
                console.log("Initialising help window");
                //create the window
                helpWindow = d3.select("svg").append("g")
                    .attr("transform",
                          "translate(" + (usableWidth - columnWidth) + "," + (usableHeight - helpSize) + ")")
                    .attr("id","helpWindow");
                helpWindow.append("rect")
                    .style("fill","black")
                    .attr("width",columnWidth)
                    .attr("height",helpSize);
            }

            //resize the rectangle:
            helpWindow.attr("transform","translate(" + (usableWidth - columnWidth) + "," + (usableHeight - helpSize) + ")");
            helpWindow.select("rect").attr("width",columnWidth);

            //create a help window from the main svg
            //console.log("binding help text:",helpText);
            var boundSelection = helpWindow.selectAll("text").data(helpText);

            boundSelection.enter()
                .append("text")
                .style("text-anchor","middle")
                .style("fill","white");
            
            boundSelection.attr("transform",function(d,i){
                return "translate("+ (columnWidth * 0.5) + "," + (30 + i * 20) +")";
            })
                .text(function(d){
                    return d;
                });

            boundSelection.exit().remove();
        };
        
        //----------------------------------------
        //CLI FUNCTION:
        //note: uses lookup to the commands object.
        
        /*
          @purpose Main selection here sets up parsing from input
          and clearing after the user presses enter.
        */
        console.log("Setting up Text input");
        d3.select('#shellInput').on("keydown",function(e){
            if(d3.event.keyCode === 13){ //ie:"Enter"
                console.log(".");
                console.log("..");
                console.log("...");
                //Get the text
                var line = d3.select(this).node().value;
                console.log("Command: ",line);
                d3.select(this).node().value = "";
                //Attempt to call a command using the text
                try{
                    if (line !== null){
                        var splitLine = line.trim().split(" ");
                        //figure out what mode you are in
                        //default to node view
                        currentCommandMode = "node";
                        //shift to rule view when appropriate
                        //console.log("Checking command type:",theShell.cwd.tags.type,theShell.cwd);
                        if(theShell.cwd.tags.type === "rule"){
                            currentCommandMode = "rule";
                        }
                        //console.log("Command mode: ", currentCommandMode, "Commands: ", columnNames[currentCommandMode]);
                        if(commands[splitLine[0]] !== undefined){
                            console.log("General Command",splitLine,splitLine.slice(1));
                            commands[splitLine[0]](theShell,splitLine.slice(1));
                        }else{
                            //get the command
                            var command = commands[currentCommandMode][splitLine[0]];
                            if (command !== undefined){
                                //call the command, slicing off the command itself
                                //console.log("Calling command:",splitLine[0]);
                                command(theShell,splitLine.slice(1));
                            }else{
                                console.log("unrecognised command: " + splitLine[0]);
                            }
                        }

                        //Redisplay:
                        console.log("Shell cwd state:",theShell.cwd);
                        commands.context(theShell);
                        //recheck the command type for displaying help
                        if(theShell.cwd.tags.type === "rule"){
                            currentCommandMode = "rule";
                        }else{
                            currentCommandMode = "node";
                        }

                        //Update the displayed help
                        displayHelp(calcWidth(usableWidth,_.values(columnNames[currentCommandMode]).length), helpData[currentCommandMode]);

                    }
                }catch(err){
                    alert("Input error: \n" + err.message);
                    console.log("Input Error:",err);
                }
            }else{
                //Otherwise not enter, user is still typing commands:
                //HERE would be the automatic selection and display of possible
                //values
                var theValue = (d3.select(this).node().value + d3.event.key);
                //Display what has been detected:

            }
        });

        //END OF CLI FUNCTION
        //----------------------------------------

        //----------------------------------------
        //DRAWING SETUP SECTION
        //----------------------------------------
        
        //Setup the svg for drawing
        var svg = d3.select('body').append('svg')
            .attr('width',usableWidth)
            .attr('height',window.innerHeight - 30);

        /**
           @function draw
           @purpose draws a node or a rule, switching modes as necessary
         */
        var draw = function(node){
            //validate:
            if(!(node && node.tags && node.tags.type)) throw new Error("Unexpected node");

            //If cwd === node
            if(node.tags.type !== 'rule'){
                //console.log("Drawing nodes");
                //setup columns
                columnWidth = calcWidth(usableWidth,columnNames.node.length);
                if(Object.keys(columns).length !== columnNames.node.length){
                    console.log("Cleaning up columns");
                    //cleanup everything there at the moment
                    Object.keys(columns).map(function(d){
                        console.log("Removing",d,columns[d]);
                        d3.select("#"+d).remove();
                    });
                    //console.log("cleaned up columns:",columns);
                    //re-init
                    columns = {};
                    //add
                    columnNames.node.map(function(d,i){
                        this[d] = initColumn(d,i,columnWidth);
                    },columns);
                    //console.log("Final Columns:",columns);
                }
                drawNode(node,columnWidth);
            }else if(node.tags.type === "rule"){
                //OTHERWISE: dealing with rules
                console.log("Drawing rules");
                //setup columns
                columnWidth = calcWidth(usableWidth,columnNames.rule.length);
                if(Object.keys(columns).length !== columnNames.rule.length){
                    console.log("Cleaning up columns");
                    //cleanup
                    Object.keys(columns).map(function(d){
                        d3.select("#"+d).remove();
                    });
                    //re-init
                    columns = {};
                    //add
                    columnNames.rule.map(function(d,i){
                        this[d] = initColumn(d,i,columnWidth);
                    },columns);
                }
                //switch to rule mode
                drawRule(node,columnWidth);
            }else{
                throw new Error("Unrecognised Node Type:",node);
            }
        };

        //----------------------------------------
        /**
           @function drawNode
           @purpose Draws a single node in the centre column, and parent/child nodes
           for the other two columns
         */
        var drawNode = function(node,columnWidth){
            //validate:
            if(node === undefined){
                throw new Error("DrawNode called on undefined node");
            }
            if(columnWidth === undefined){
                console.warn("No column width specified for drawNode, defaulting to 200");
                columnWidth = 200;
            }
            //console.log("Drawing node:",node);
            
            //draw in each column as is necessary:
            var nodeColumn = d3.select("#ShellNode");

            var bound = nodeColumn.selectAll("g").data([node],function(d){
                return d.id;
            });

            bound.exit().remove();

            var theNode = bound.enter().append("g").attr("id","theNode")
                .attr("transform","translate(" +
                      (columnWidth * 0.1) + "," + (drawOffset + 20) + ")");
            
            theNode.append("rect");
            
            //update the rectangles
            bound.selectAll("rect")
                .attr("width",(columnWidth * 0.8))
                .attr("height",300)
                .attr("rx",10)
                .attr("ry",10);

            //draw the text of the node
            var nodeInternalText  = theShell.getListsFromNode(node,["id","name","values","tags","annotations"]);
            //select all existing and bind
            var boundText = bound.selectAll("text").data(nodeInternalText);
            
            //for new stuff, create the node but dont set its text
            boundText.enter().append("text")
                .attr("transform",function(d,i){
                    return "translate(" + (columnWidth * 0.4) + "," + (15 + i * 15) + ")";
                })
                .style("text-anchor","middle")
                .style("fill","white");
            //remove old text:
            boundText.exit().remove();
            //now set the text of all existing texts
            boundText.text(function(d,i){
                //console.log(i,":",d);
                return d;
            });

            //Deprecated, this is switched to work with children and parent
            //lists as id's ONLY, to allow for JSON.stringify to work
            //var childList = _.values(node.children);
            //var parentList = _.values(node.parents);

            var childList = _.keys(node.children).map(function(d){
                return this.allNodes[d];
            },theShell);
            var parentList = _.keys(node.parents).map(function(d){
                return this.allNodes[d];
            },theShell);

            //console.log("To Draw columns with:",childList,parentList);
            
            drawMultipleNodes('Parents',parentList,columnWidth);
            drawMultipleNodes('Children',childList,columnWidth);
            
        };

        
        /**
           @function drawRule
           @purpose Renders the current rule 
           @param rule The RuleNode object to draw, that contains the rule Object
        */
        var drawRule = function(ruleNode,columnWidth){
            //validation
            if(rule === undefined){
                //Cleanup
                d3.select("#rule").select("#mainRuleInfo").remove();
                return;
            }
            if(columnWidth === undefined){
                console.warn("No column width specified for drawRule, defaulting to 200");
                columnWidth = 200;
            }
            //main:
            console.log("Drawing:",rule);
            var ruleContainer = svg.select("#rule");
            //bind data
            var bound = ruleContainer.selectAll("g").data([ruleNode],function(d){
                return d.id;
            });
            //remove old data?
            bound.exit().remove();

            //Add a container to draw the rule's information in
            var container = bound.enter().append("g")
                .attr("transform","translate(" +
                      (columnWidth * 0.1)+ ","+(drawOffset + 20)+")")
                .attr("id","mainRuleInfo");
            
            //TODO:draw the parent rule container? of the graph
            //draw the rect
            container.append("rect")
                .style("fill",function(d){
                    //TODO: colour by something else?
                    return colourScale(scaleToColour(_.values(d.conditions).length));
                })
                .attr("width",(columnWidth * 0.8))//not as wide as the container
                .attr("height","500")
                .attr("rx",10)
                .attr("ry",10);

            //get data from the rule:
            var boundText = container.selectAll("text").data(theShell.ruleToStringList(ruleNode));
            //new stuff
            boundText.enter().append("text")
                .attr("text-anchor","middle")
                .attr("transform",function(d,i){
                    return "translate(" + (columnWidth * 0.4) + "," + (30 + i * 30) + ")";
                });
            //old stuff
            boundText.exit().remove();
            //remaining stuff
            boundText.text(function(d){
                return d;
            });
            
            //note: currently draw multiple nodes expected
            //draw node information,bindings,tags, etc
            drawMultipleNodes("conditions",ruleNode.conditions,columnWidth);

            //convert stored action id's to action nodes for drawing
            var actions = _.keys(ruleNode.actions).map(function(d){
                return this.allNodes[d];
            },theShell);
            
            drawMultipleNodes("actions",actions,columnWidth);

            
            //TODO:
            //drawMultipleNodes("parents",[],columnWidth);
            //drawMultipleNodes("children",[],columnWidth);
        };

        //------------------------------

        /**
           @function drawMultipleNodes
           @purpose Draw a column of conditions
           @param baseContainer The container column to use
           @param childArray The array of information to render
        */
        var drawMultipleNodes = function(baseContainer,childArray,columnWidth){
            console.log("Drawing Column:",baseContainer,childArray);
            //console.log("Column Length:",childArray.length);
            
            var containingNode = getColumnObject(baseContainer);
            var heightAvailable = containingNode.select("rect").attr("height");
            heightAvailable -= 20; //-20 for top and bottom

            var gOffset = function(i){
                return (drawOffset + (i * (heightAvailable / childArray.length)));
            };
            
            //bind the data
            var nodes = containingNode.selectAll(".node")
                .data(childArray,function(d,i){
                    return baseContainer + d.id;
                });
            
            //remove any old nodes
            nodes.exit().remove();
            //create each new node
            var inodes = nodes.enter().append("g")
                .classed("node",true);

            //append to the enter selection:
            inodes.append("rect")
                .style("fill",function(d){
                    return colourScale(scaleToColour(_.values(d.constantTests).length));
                })
                .attr("width",(columnWidth * 0.8))
            //this transform causes cascade transforms for header text
            //and context text
                .attr("transform","translate(0,10)")
                .attr("rx",10)
                .attr("ry",10);

            //HEADER TEXT:
            inodes.append("text")
                .style("text-anchor","middle")
            //* 0.4 because the overall container is shifted by 0.1
            //30 because the rect is down by 10
                .attr("transform","translate(" + (columnWidth * 0.4)+",30)")
                .text(function(d,i){
                    return theShell.nodeToShortString(d,i);
                });
            
            //update selection:
            nodes.selectAll("rect")
                .attr("height",(heightAvailable / childArray.length) - 5);

            nodes.attr("transform",function(d,i){
                return "translate(" + (columnWidth * 0.1) + "," + gOffset(i) + ")";
            });

            //----------------------------------------
            //Draw tests if condition
            if(baseContainer === "conditions"){
                drawConditions(nodes,columnWidth);
                return;
            }

            if(baseContainer === "actions"){
                drawActions(nodes,columnWidth);
                return;
            }
        };


        /**
           @function drawActions
           @purpose Draws the actions that are part of a rule, showing the values and arithmetic of the action
         */
        var drawActions = function(nodes,columnWidth){
            nodes.selectAll(".actionElement").remove();
            //draw additional info for each action
            //draw action type
            //draw values
            //draw arithmetic actions
            
            //already bound node, so d = an action
            var actionElements = nodes.selectAll(".actionElement").data(function(d,i){
                var info = [];
                info.push(d.tags.actionType + "{");

                //TODO: align here
                var textPairs = _.keys(d.values).map(function(key){
                    return [key,d.values[key]];
                });
                console.log("TextPairs:",textPairs);
                var alignedText = utils.textAlignPairs(textPairs);
                console.log("AlignedPairs:",alignedText);
                var finalText = alignedText.map(function(d){
                    return d[0] + ": " + d[1];
                });
                info = info.concat(finalText);
                info.push("}");

                info.push("Arithmetic:");
                _.keys(d.arithmeticActions).forEach(function(key){
                    info.push(key + d.arithmeticActions[key][0] + d.arithmeticActions[key][1]);
                });
                console.log("Action info:",info);
                return info;
            });

            actionElements.exit().remove();

            var newActionInfo = actionElements.enter().append("g")
                .classed("actionElement",true)
                .attr("transform",function(d,i){
                    return "translate("+ (columnWidth * 0.4) + "," + (50 + (i * 20)) + ")";
                });
            
            newActionInfo.append("text")
                .attr("text-anchor","middle");

            actionElements.selectAll("text")
                .text(function(d){
                    return d;
                });
            
        };


        /**
           @function drawConditions
           @purpose Draws conditions, rendering the internal tests and bindings as well
         */        
        var drawConditions = function(nodes,columnWidth){
            nodes.selectAll(".conditionElement").remove();

            //function extracts information from the already bound node
            //function(d,i)-> d = a condition
            var testsPerCondition = nodes.selectAll(".conditionElement").data(function(d,i){
                var tests = ["Tests:"];
                tests = tests.concat(d.constantTests);
                tests.push("Bindings:");
                tests = tests.concat(d.bindings);
                console.log("Output tests:",tests);
                return tests;
            });

            testsPerCondition.exit().remove();

            //CONTENT:
            var newTests = testsPerCondition.enter().append("g")
                .classed("conditionElement",true)
                .attr("transform",function(d,i){
                    //50 because the condition header is 30.
                    return "translate(" + (columnWidth * 0.4) + "," + (50 + (i * 20)) + ")";
                });

            newTests.append("text")
                .attr("text-anchor","middle");

            //Draw the specific forms you can get in conditions:
            testsPerCondition.selectAll("text")
                .text(function(d){
                    if(typeof d === "string"){
                        //headers (ie: c_0, TESTS, BINDINGS)
                        return d;                       
                    }else if(d.field && d.operator && d.value){
                        //TESTS
                        return d.field + " " + d.operator + " " + d.value;
                    }else if(d instanceof Array){
                        //BINDINGS
                        return d[0] + " <- wme." + d[1];
                    }
                });
            
        };

        //------------------------------
        // Search bar drawing:
        //------------------------------


        /**
           @function drawSearchColumn
           @purpose draws the results of a search
         */
        var drawSearchColumn = function(nodeList,columnWidth){
            //convert data as needed:
            var infoList = ["Search results:"].concat(nodeList.map(function(d){
                return "(" + d.id + "): " + d.name;
            }));

            
            //set up the container:
            var searchColumn = d3.select("#searchColumn");
            if(searchColumn.empty()){
                searchColumn = d3.select("svg").append("g")
                    .attr("id","searchColumn");
            }

            //draw the rectangle
            var rect = searchColumn.append("rect")
                .attr("width",(columnWidth * 0.8))
                .attr("height",usableHeight)
                .attr("rx",10)
                .attr("ry",10)
                .style("fill","black")
                .attr("transform","translate(" + (columnWidth * 0.1) + ",0)");

            searchColumn.selectAll("text").remove();

            if(infoList.length === 1){
                //there is only the results header, quit
                searchColumn.remove();
                return;
            }
            
            //bind data
            var boundSelection = searchColumn.selectAll("text").data(infoList);

            //draw data
            boundSelection.enter().append("text")
                .attr("transform",function(d,i){
                    return "translate("+
                        (columnWidth * 0.5) + "," + (30 + i * 30) + ")";
                })
                .attr("text-anchor","middle")
                .text(function(d){
                    return d;
                })
                .style("fill","white");

        };


        /**
           @function drawStash
           @purpose Draws the stack of temporary nodes
         */
        var drawStash = function(valueArray){
            var stashedList = valueArray.map(function(d){
                return "(" + d.id + "): " + d.name;
            }).reverse(); //reverse so last thing added is first thing drawn

            var stashContainer = d3.select("#stashContainer");
            if(stashContainer.empty()){
                stashContainer = d3.select("svg").append("g")
                    .attr("id","stashContainer")
                    .attr("transform",function(){
                        return "translate(" + (usableWidth * 0.3) + "," + (usableHeight * 0.935 ) + ")";
                    });
            }

            stashContainer.selectAll("text").remove();

            //draw a simple list of text
            var boundTexts = stashContainer.selectAll("text").data(stashedList);

            boundTexts.enter().append("text")
                .attr("text-anchor","right")
                .style("fill","black")
                .attr("transform",function(d,i){
                    return "translate(0," + (i * 15 ) + ")";
                })
                .text(function(d,i){
                    return d;
                });
            
        };

        /**
           @function drawActivatedRules
           @purpose
           @param list
           @param columnWidth
         */
        var drawActivatedRules = function(list,columnWidth){
            var firedRulesContainer = d3.select("#firedRules");
            if(firedRulesContainer.empty()){
                firedRulesContainer = d3.select("svg").append("g")
                    .attr("id","firedRules")
                    .attr("transform","translate(" + (usableWidth - columnWidth) + "," + (drawOffset + 20)+ ")");


            firedRulesContainer.append("rect")
                .attr("width",columnWidth)
                .attr("height",600)
                .attr("rx",10)
                .attr("ry",10);

            }
            
            firedRulesContainer.selectAll("text").remove();

            //TODO: convert list to strings first
            var columnData = ["Activated Rules:"].concat(list);
            
            var texts = firedRulesContainer.selectAll("text").data(columnData);

            texts.enter().append("text")
                .attr("transform",function(d,i){
                    return "translate(" + (columnWidth * 0.5) + "," + (30 + i * 20) + ")";
                })
                .attr("text-anchor","middle")
                .text(function(d){
                    return "Activated Rule";
                });

        };

        
        
        //------------------------------
        //Startup:
        //------------------------------

        //call the draw command to show the initial state
        console.log("Starting");
        commands.context(theShell);
        //Focus on the text input automatically on page load
        d3.select("#shellInput").node().focus();
        displayHelp(calcWidth(usableWidth,3),helpData.node);
    }catch(e){
        alert("General Error: \n" + e.message);
        console.log("An Error Occurred:",e);
    }
});
