/**
   @file webMain
   @purpose Defines the web interface, and drawing methods, for the shell
*/

//Setup requirejs
require.config({
    baseUrl: "/src",
    paths:{
        underscore : "/libs/underscore",
        GraphNode : "Node/GraphNode",
        GraphStructureConstructors:"Node/GraphStructureConstructors",
        NodeCommands : "Commands/NodeCommands",
        RuleCommands : "Commands/RuleCommands",
        ReteCommands : "Commands/ReteCommands",
        utils : "utils",
        d3 : "/libs/d3.min",
        TotalShell : "TotalShell",
        ReteInterface : "Rete/ReteInterface",
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
    console.log("Starting Total Authoring Shell");
    if(Shell === undefined) throw new Error("Shell is undefined");

    //----------------------------------------
    //GLOBALS
    //----------------------------------------
    var maxNumberOfNodesInAColumn = 10;
    var maxNumberOfChildrenVisible = 40;

    //Commands stored in here:
    var commands = {};
    //Help texts:
    var helpData = {};

    var currentCommandMode = "node";
    //The columns for the different modes:
    var columnNames = {
        "node" : ["Parents","ShellNode","Children"],
        "rule" : ["conditions","rule","actions"]
    };
    
    //The simulated shell:
    var theShell = new Shell.CompleteShell();

    if(theShell === undefined){
        throw new Error("Shell is undefined");
    }

    var lastSetOfSearchResults = [];
    //COLOURS:
    var scaleToColour = d3.scale.linear()
        .range([0,20])
        .domain([0,20]);
    var colourScale = d3.scale.category20b();
    
    //----------------------------------------
    //DRAWING GlOBAL VARIABLES SECTION
    //----------------------------------------
    console.log("Initialising Drawing variables");
    //The y offset for rectangles so they
    //arent at the very top of the screen
    var colours =  {
            grey : d3.rgb(19,21,27),
            text : d3.rgb(237,255,255),
            textBlue : d3.rgb(98,188,238),
            textGrey : d3.rgb(132,146,154),
            darkBlue : d3.rgb(23,50,77),
            darkerBlue : d3.rgb(20,38,60),
            lightBlue: d3.rgb(53,99,142),
            green : d3.rgb(108,141,7),
        };

    
    var drawOffset = 50;
    //The height of the bottom supplemental columns
    var supplementalHeight = 300;
    var supplementalWidth = 200;
    var usableWidth = window.innerWidth - 30;
    var usableHeight = window.innerHeight - 30;
    //Setup the svg for drawing
    var svg = d3.select('body').append('svg')
        .attr('width',usableWidth)
        .attr('height',window.innerHeight - 30)
        .style("background",colours.darkerBlue);

    //the column objects, to be created per mode
    var columns = {};
    var columnWidth = 200;
    var helpSize = 400;

    //Utility functions:
    var HalfWidth = function(){
        return (window.innerWidth - 10) * 0.5;
    };
    var HalfHeight = function(){
        return (window.innerHeight - 30) * 0.5;
    };
    
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
            .attr("transform","translate("+ (columnWidth * 0.5)+",40)")
            .style("fill",colours.textBlue);

        //display the column as a rectangle
        newColumn.append("rect")
            .attr("width",columnWidth-20)
            .attr("height",window.innerHeight - 200)
            .style("opacity",1)
            .attr("rx",10)
            .attr("ry",10)
            .attr("transform","translate(10,"+drawOffset+")")
            .style("fill",colours.grey);
        return newColumn;
    };


    
    
    //----------------------------------------
    //COMMAND SECTION
    //----------------------------------------
    //Maps typed commands to methods on shell, in different modes
    console.log("Setting up commands");
    
    /**
       @data commands
       @purpose Object that stores all actions a user can perform
    */
    commands = {
        "node" : NodeCommands,
        "rule" : RuleCommands,
        //called after every command to update the view
        "context": function(sh,values){
            //draw main columns and nodes
            draw(sh.cwd);
            //draw additional elements:
            drawActivatedRules(sh.reteNet.lastActivatedRules);
            drawStash(sh._nodeStash);
            drawSearchColumn(sh.lastSearchResults);
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
        "json" : function(sh,values){
            var text = sh.exportJson();
            //From: http://stackoverflow.com/questions/10472927/add-content-to-a-new-open-window
            var myWindow = window.open('data:application/json;' + (window.btoa?'base64,'+btoa(text):text));
        },
        "files" : function(sh,values){
            window.open("./data/","_blank");
        }
    };

    //Import rete commands into root level of general:
    _.keys(ReteCommands).forEach(function(d){
        this[d] = ReteCommands[d];
    },commands);


    //** @data helpData @purpose For displaying reference of commands
    helpData = {
        node : {
            "helpGeneral" : ["", "Display General Commands Help"],
            "new"   : ["$target $type $name", "Add a node to the graph."],
            "nc"    : [ "[n | i | r | a ] $name", " Shortcuts for adding children. Nodes, institutions, roles, activities."],
            "np"    : [ "[n | i | r | a ] $name", " Shortcuts for adding parents."],
            "[ncn | nci]" : [ "$name", "new child node/institution."],
            "rm"    : [ "$id", " Remove a node by id number."],
            "cd"    : [ "[.. | $name | $id]", " Move to a node by name or id."],
            "rename": [ "$name", " Rename a node."],
            "set"   : [ "$field $parameter $value", " Set a value of a node. ie: set tag type myType."],
            "link"  : [ "$target $id", " Link two existing nodes."],
            "linkr" : [ "$target $id", " Link two existing nodes reciprocally."],
            "stash" : [ "", " Add the current node to the temp stack."],
            "unstash": ["", " Pop off and move to the head of the temp stack."],
            "top"   : [ "", " Move to the top of the temp stack."],
            "prev"  : [ "", " Move to the node previously you were at before the current node. "],
            "search" : [ "$target $pattern $focusType", " Search for all nodes where a pattern applied to a type in the target field matches."],
        },
        rule : {
            "helpGeneral" : [ "", "Display General Commands Help"],
            "cd"    : [ "[.. | $name | $id]", "Move to other nodes."],
            "new condition" : [ " ", " Create a new condition for the current rule. (IF)"],
            "new action" : [ "$name+", " Create a new action for the current rule. (THEN)"],
            "new test" : [ "$num $field $op $value", " Create a constant test for the condition id'd."],
            "rm"     : [ "[condition | action] $id", " Remove a condition/action/test"],
            "set"    : [ "[binding | arith | actionValue | actionType | test] [values]", " Set values of conditions/actions"],
            "rename" : ["", " Rename the rule"],
            "add"    : [ "", " ???"],
            

        },
        general: {
            "load"  : [ "$fileName", " Load a specified file in to populate the shell"],
            "save"  : [ "$fileName", " Save to a specified file. With paired server ONLY"],
            "json"  : [ "", " Open a tab with the shell as json"],
            "files" : [ "", " Display a list of available files to load"],
            "assert": [ "", " Assert all children of the cwd as wmes"],
            "compile" : [ "", " Compile all rules in the shell into the rete net"],
            "ruleStep" : [ "", " Perform the actions of the fired rules from the last assertion"],
            "clear" : [ "[complete]", " Clear wmes from the rete net, or reinit the net completely"],
        }
    };

    //----------------------------------------
    //DISPLAY FUNCTIONS SECTION
    //----------------------------------------

    /**
       @function displayHelp
       @purpose Draw a help window, and display the help text for commands
       @param columnWidth
       @param helpDataSubGrammar
    */
    var displayHelp = function(helpDataSubGrammar){
        //Create the text to be displayed
        var startText = "Current Mode: " + currentCommandMode;
        var helpText = [startText,"Available Commands: ",""].concat(_.keys(helpDataSubGrammar).map(function(d){
            return d + " " + helpDataSubGrammar[d].join(" ---> ");
        }));

        //Get the container:
        var helpWindow = d3.select("#helpWindow");
        if(helpWindow.empty()){
            //Initialise the help container
            helpWindow = d3.select("svg").append("g")
                .attr("transform",
                      "translate(" + (usableWidth * 0.25) + "," + (usableHeight * 0.25) + ")")
                .attr("id","helpWindow");
            helpWindow.append("rect")
                .style("fill",colours.darkBlue)
                .attr("width",usableWidth * 0.5)
                .attr("height",helpSize)
                .attr("rx",10)
                .attr("ry",10);
        }

        //resize the rectangle:
        // helpWindow.attr("transform","translate(" + (usableWidth - columnWidth) + "," + (usableHeight - helpSize) + ")");
        // helpWindow.select("rect").attr("width",columnWidth);

        //create a help window from the main svg
        //console.log("binding help text:",helpText);
        var boundSelection = helpWindow.selectAll("text").data(helpText);

        boundSelection.enter()
            .append("text")
            .style("text-anchor","left")
            .style("fill",colours.textBlue);
        
        boundSelection.attr("transform",function(d,i){
            return "translate("+ (usableWidth * 0.02)
                + "," + (30 + i * 20) +")";
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
                    //displayHelp(calcWidth(usableWidth,_.values(columnNames[currentCommandMode]).length), helpData[currentCommandMode]);

                }
            }catch(err){
                //alert("Input error: \n" + err.message);
                console.log("Input Error:",err);
            }
        }else{
            //Otherwise not enter, user is still typing commands:
            //HERE would be the automatic selection and display of possible
            //values
            var theValue = (d3.select(this).node().value + d3.event.key);
            var textArray = theValue.split(" ");
            var last = textArray.pop();
            if(last === 'help'){
                console.log("Help!");
                displayHelp(helpData[currentCommandMode]);
            }else if(last === 'helpGeneral'){
                console.log("Help General");
                displayHelp(helpData['general']);
            }else{
                console.log("Clearing help");
                d3.select("#helpWindow").remove();
            }
            //todo: Display what has been detected:
        }
    });

    //END OF CLI FUNCTION
    //----------------------------------------

    //----------------------------------------
    //DRAWING SETUP SECTION
    //----------------------------------------

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
            if(_.difference(columnNames.node,_.keys(columns)).length > 0){
                //if(Object.keys(columns).length !== columnNames.node.length){
                console.log("Cleaning up columns");
                //cleanup everything there at the moment
                Object.keys(columns).forEach(function(d){
                    console.log("Removing",d,columns[d]);
                    d3.select("#"+d).remove();
                });
                //console.log("cleaned up columns:",columns);
                //re-init
                columns = {};
                //add
                columnNames.node.forEach(function(d,i){
                    this[d] = initColumn(d,i,columnWidth);
                },columns);
                //console.log("Final Columns:",columns);
            }
            drawNode(node,columnWidth);
        }else if(node.tags.type === "rule"){
            //OTHERWISE: dealing with rules
            //console.log("Drawing rules");
            //setup columns
            columnWidth = calcWidth(usableWidth,columnNames.rule.length);
            if(_.difference(columnNames.rule,_.keys(columns)).length > 0){
                //if(_.keys(columns).length !== columnNames.rule.length){
                //console.log("Cleaning up columns");
                //cleanup
                _.keys(columns).forEach(function(d){
                    d3.select("#"+d).remove();
                });
                //re-init
                columns = {};
                //add
                columnNames.rule.forEach(function(d,i){
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
            .style("fill",colours.textBlue);
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
        if(ruleNode === undefined){
            //Cleanup
            d3.select("#rule").select("#mainRuleInfo").remove();
            return;
        }
        if(columnWidth === undefined){
            console.warn("No column width specified for drawRule, defaulting to 200");
            columnWidth = 200;
        }
        //main:
        //console.log("Drawing:",ruleNode);
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
            })
            .style("fill",colours.textBlue);
        //old stuff
        boundText.exit().remove();
        //remaining stuff
        boundText.text(function(d){
            return d;
        });
        
        //note: currently draw multiple nodes expected
        //draw node information,bindings,tags, etc
        var conditionList = _.keys(ruleNode.conditions).map(function(d){
            return this.allNodes[d];
        },theShell);
        
        drawMultipleNodes("conditions",conditionList,columnWidth);

        //convert stored action id's to action nodes for drawing
        var actions = _.keys(ruleNode.actions).map(function(d){
            return this.allNodes[d];
        },theShell);
        
        drawMultipleNodes("actions",actions,columnWidth);

        
        //TODO:
        //for the institution the rule is located in:
        //get all defined fact templates
        //get all implied fact templates
        //draw them in the potential condition list
        //drawMultipleNodes("parents",[],columnWidth);
        
        //for the institution the rule is located in
        //get all defined action templates
        //get all implied action templates
        //draw them in the potential action list
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
        //console.log("Drawing Column:",baseContainer,childArray);
        var containingNode = getColumnObject(baseContainer);
        //If There are too many nodes:
        if(childArray.length > maxNumberOfChildrenVisible){
            childArray = childArray.slice(0,maxNumberOfChildrenVisible);
        }
        if(childArray.length > maxNumberOfNodesInAColumn){
            var nodes = drawNodes(containingNode,collapseData(childArray),columnWidth);
            //transform to displayable representation:
            var texts = nodes.selectAll("text").data(function(d,i){
                return ["Aggregate of " + d.noOfValues + " nodes"].concat(d.values.map(function(e){return "Id: " + e.id +", " + e.name;}));
            });

            //Draw the text:
            texts.enter().append("text")
                .style("text-anchor","middle")
                .attr("transform",function(d,i){
                    return "translate(" + (columnWidth * 0.4)+"," + (30 + i * 15) + ")";
                })
                .text(function(d,i){
                    return d;
                })
                .style("fill",colours.textBlue);
            
        }else{//There ARENT too many nodes:
            var nodes = drawNodes(containingNode,childArray,columnWidth);
            //HEADER TEXT:
            nodes.append("text")
                .style("text-anchor","middle")
            //* 0.4 because the overall container is shifted by 0.1
            //30 because the rect is down by 10
                .attr("transform","translate(" + (columnWidth * 0.4)+",30)")
                .text(function(d,i){
                    return theShell.nodeToShortString(d,i);
                })
                .style("fill",colours.textBlue);
            //Draw tests if condition
            if(baseContainer === "conditions"){
                drawConditions(nodes,columnWidth);
                return;
            }
            
            if(baseContainer === "actions"){
                drawActions(nodes,columnWidth);
                return;
            }
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
            //console.log("TextPairs:",textPairs);
            var alignedText = utils.textAlignPairs(textPairs);
            //console.log("AlignedPairs:",alignedText);
            var finalText = alignedText.map(function(d){
                return d[0] + ": " + d[1];
            });
            info = info.concat(finalText);
            info.push("}");

            info.push("Arithmetic:");
            _.keys(d.arithmeticActions).forEach(function(key){
                info.push(key + d.arithmeticActions[key][0] + d.arithmeticActions[key][1]);
            });
            //console.log("Action info:",info);
            return info;
        });

        actionElements.exit().remove();

        var newActionInfo = actionElements.enter().append("g")
            .classed("actionElement",true)
            .attr("transform",function(d,i){
                return "translate("+ (columnWidth * 0.4) + "," + (50 + (i * 20)) + ")";
            });
        
        newActionInfo.append("text")
            .attr("text-anchor","middle")
            .style("fill",colours.textBlue);

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
            tests = tests.concat(_.pairs(d.bindings));
            //console.log("Output tests:",tests);
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
            .attr("text-anchor","middle")
            .style("fill",colours.textBlue);

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


    /**
       @function collapseData
       @purpose Collapses a list of too much data to groups of data
       @param an array
       @return an array of arrays, none of which are larger than the global
       maxNumberOfNodesInAColumn
    */
    var collapseData = function(array){
        //console.log("Collapsing:",array);
        //collapse into groups
        var reducedArr = array.reduce(function(memo,curr,i){
            if(i % maxNumberOfNodesInAColumn === 0){
                memo.push([]);
            }
            memo[memo.length-1].push(curr);
            return memo;
        },[]);

        //convert to a usable object representation
        var objArray = reducedArr.map(function(d){
            return {
                tags : {type: "aggregate"},
                noOfValues : d.length,
                values: d,
                id: d[0].id || 0,
            }
        });
        //console.log("Resulting aggregate:",objArray);
        return objArray;
    };


    /**
       @function drawNodes
       @purpose generic draw a bunch of nodes, returning the selection for further details
       @param baseContainer
       @param childArray
       @param columnWidth
       @returns created node selection
    */
    var drawNodes = function(containingNode,array,columnWidth){

        var heightAvailable = containingNode.select("rect").attr("height");
        heightAvailable -= 20; //-20 for top and bottom
        //function to calculate the g's vertical offset
        var gOffset = function(i){
            return (drawOffset + (i * (heightAvailable / array.length)));
        };
        
        //clear old data
        containingNode.selectAll(".node").remove();
        
        //bind the data            
        var nodes = containingNode.selectAll(".node")
            .data(array,function(d,i){
                return d.id;
            });            

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
        
        //update selection:
        nodes.selectAll("rect")
            .attr("height",(heightAvailable / array.length) - 5);

        nodes.attr("transform",function(d,i){
            return "translate(" + (columnWidth * 0.1) + "," + gOffset(i) + ")";
        });

        return inodes;
    };
    
    
    //------------------------------
    // Search bar drawing:
    //------------------------------

    /**
       @function drawSearchColumn
       @purpose draws the results of a search
    */
    var drawSearchColumn = function(nodeList){
        //convert data as needed:
        var infoList = ["Search results:"].concat(nodeList.map(function(d){
            return "(" + d.id + "): " + d.name;
        }));

        //console.log("Search Results to Draw:",infoList);
        
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
            .style("fill",colours.textBlue);

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
            .style("fill",colours.textBlue)
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
    var drawActivatedRules = function(list){
        //setup the data:
        //console.log("drawing activated rules:",list);
        //Split into assertions and retractions:

        var assertions = _.filter(list,function(e){
            return e.action === 'asserted';
        });
        var retractions = _.filter(list,function(e){
            return e.action === 'retracted';
        });

        var assertText = assertions.map(function(e){
            return "Assert:" + JSON.stringify(e.payload.data);
        });
        var retractText = retractions.map(function(e){
            return "Retract:" + JSON.stringify(e.payload.data);
        });

        var totalText = assertText.concat(retractText);
        
        //Add the text:
        var columnData = ["Activated Rules:"].concat(totalText);
        
        
        //Select/Setup the container
        var firedRulesContainer = d3.select("#firedRules");
        if(firedRulesContainer.empty()){
            firedRulesContainer = d3.select("svg").append("g")
                .attr("id","firedRules");
            
            firedRulesContainer.append("rect")
                .attr("height",600)
                .attr("rx",10)
                .attr("ry",10);
            
        }

        //Update the widths:
        firedRulesContainer.attr("transform","translate(" + (usableWidth - columnWidth) + "," + (drawOffset + 20)+ ")");
        firedRulesContainer.select("rect").attr("width",columnWidth);

        //Clear
        firedRulesContainer.selectAll("text").remove();

        //Bind data:
        var texts = firedRulesContainer.selectAll("text").data(columnData);

        texts.enter().append("text")
            .attr("transform",function(d,i){
                return "translate(" + (columnWidth * 0.5) + "," + (30 + i * 20) + ")";
            })
            .attr("text-anchor","middle")
            .text(function(d){
                return d;
            })
            .style("fill",colours.textBlue);

    };
    
    //------------------------------
    //Startup:
    //------------------------------

    //call the draw command to show the initial state
    console.log("Starting");
    commands.context(theShell);
    //Focus on the text input automatically on page load
    d3.select("#shellInput").node().focus();
});
