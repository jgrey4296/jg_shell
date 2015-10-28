/**Entry point for shell.html graph authoring program
   @file webMain
*/
require.config({
    baseUrl: "/",
    paths:{
        "../libs/underscore": "/libs/underscore",
        underscore : "libs/underscore",
        ReteDataStructures : 'libs/ReteDataStructures',
        DataStructures : "src/DataStructures",
    },
    shim:{
        "../libs/underscore":{
            exports:'_'
        },
        underscore :{
            exports:'_'
        },
    }
});

/*
  Creates a single shell instance, a command map,
  and then the authoring environment d3 drawing code
*/
require(['libs/d3.min','src/TotalShell','underscore'],function(d3,Shell,_){
    try{
        console.log("Starting Total Authoring Shell");
        if(Shell === undefined) throw new Error("Shell is undefined");

        //----------------------------------------
        //VARIOUS GLOBALS
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
        };
        
        //utility function to check input values for commands:
        var valueCheck = function(list,requiredLength){
            if(list.length !== requiredLength){
                throw new Error("Incorrect number of arguments: " + list);
            }
        };
        
        //----------------------------------------
        //COMMAND SECTION
        //----------------------------------------
        //Maps typed commands to methods on shell, in different modes
        console.log("Setting up commands");
        var nodeCommands = {
            //new -> addNode,
            "new" : function(sh,values){
                valueCheck(values,3,values);
                //Expand out simplifications
                console.log("new",values);
                var target = values[0];
                if(target === "child") target = "children";
                if(target === "parent") target  = "parents";
                console.log("Target:",target);
                sh.addNode(values[2],target,values[1]);
            },
            //Shortcuts:
            "nc" : function(sh,values){
                var chars = {
                    "n" : "node",
                    "i" : "institution",
                    "r" : "role",
                    "a" : "activity",
                    "rc": "rulecontainer",
                };
                if(chars[values[0]]){
                    sh.addNode(values[1],'children',chars[values[0]]);
                }
            },
            "np" : function(sh,values){
                var chars = {
                    "n" : "node",
                    "i" : "institution",
                    "r" : "role",
                    "a" : "activity",
                    "rc": "rulecontainer",
                };
                if(chars[values[0]]){
                    sh.addNode(values[1],'parents',chars[values[0]]);
                }
            },
            //New Child Node, ncn:
            "ncn" : function(sh,values){
                sh.addNode(values[0],'children','node');
            },
            //new child institution: nci
            "nci" : function(sh,values){
                sh.addNode(values[0],'children','institution');
            },
            //rm -> removeNode,
            "rm" : function(sh,values){
                sh.rm(values[0]);
            },
            //cd -> cd
            "cd" : function(sh,values){
                valueCheck(values,1);
                sh.cd(values[0]);
            },
            //set -> setParameter
            "set" : function(sh,values){
                sh.setParameter(values[0],values[1],values[2]);
            },
            //link -> link
            //TODO: detect if recursive connection or not
            "link" : function(sh,values){
                var target = values[0];
                if(target === 'child') target = 'children';
                if(target === 'parent') target = 'parents';
                sh.link(target,values[1],false);
            },
            "linkr" : function(sh,values){
                var target = values[0];
                if(target === 'child') target = 'children';
                if(target === 'parent') target = 'parents';
                sh.link(target,values[1],true);

            },
            //rename -> rename
            "rename" : function(sh,values){
                sh.rename(values[0]);
            },
            //Stashing:
            "stash" : function(sh,values){
                sh.stash();
            },
            "unstash" : function(sh,values){
                sh.unstash();
            },
            "top" : function(sh,values){
                sh.top();
            },
            "prev" : function(sh,values){
                sh.cd(sh.previousLocation);
            },
            //Search:
            "search" : function(sh,values){
                var returnedData = sh.search(values[0],values[1],values[2]);
                if(returnedData){
                    drawSearchColumn(returnedData,calcWidth(usableWidth,_.values(columnNames[currentCommandMode]).length));
                }
            }
            
        };

        var ruleCommands = {
            //cd
            "cd" : function(sh,values){
                valueCheck(values,1);
                sh.cd(values[0]);
            },
            //new -> addCondition/test/action
            "new" : function(sh,values){
                if(values[0] === "condition"){
                    sh.addCondition();
                }else if(values[0] === "action"){
                    sh.addAction(values.slice(1));
                }else if(values[0] === "test"){
                    sh.addTest(values[1],values[2],values[3],values[4]);
                }else if(values[0] === "binding"){
                    sh.addBinding(values[1],values[2],values[3]);
                }                
            },
            //rm
            "rm" : function(sh,values){


            },
            //set -> setParameter
            "set" : function(sh,values){

            },
            //rename -> rename
            "rename" : function(sh,values){

            },
            //add Binding/
            "add" : function(sh,values){

            },
        };

        //aggregated commands
        var commands = {
            "node" : nodeCommands,
            "rule" : ruleCommands,
            //called after every command to update the view
            "context": function(sh,values){
                draw(sh.cwd);
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
        //End of Commands
        
        //     //Get conditionless rules
        //     //get actionless rules
        //     //get testless conditions
        //     //get ruleless conditions

        //     //Get the next and previous rules by id
        //     "next" : function(sh,values){
        //         sh.moveTo(sh.cwd + 1);
        //     },
        //     "prev" : function(sh,values){
        //         sh.moveTo(sh.cwd - 1);
        //     },

        //the additional information for each major command
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
        
        
        var calcWidth = function(availableWidth,noOfColumns){
            return (availableWidth / (noOfColumns + 2))
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

        //Draw a help window informing what commands are available
        var displayHelp = function(columnWidth,helpDataSubGrammar){
            console.log(columnWidth + ":Available Commands:", helpDataSubGrammar);
            var helpText = ["Available Commands"].concat(_.keys(helpDataSubGrammar).map(function(d){
                return d + " " + helpDataSubGrammar[d];
            }));

            console.log("Help Text:",helpText);
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
                          "translate(" + (usableWidth - columnWidth) + ","
                          + (usableHeight - helpSize) + ")")
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

            console.log("binding:",helpText);
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
          Main selection here sets up parsing from input
          and clearing after the user presses enter.
        */
        console.log("Setting up Text input");
        //TODO: change this to keydown
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
                        console.log("Checking command type:",theShell.cwd.tags.type,theShell.cwd);
                        if(theShell.cwd.tags.type === "rule"){
                            currentCommandMode = "rule";
                        };
                        console.log("Command mode: ", currentCommandMode, "Commands: ", columnNames[currentCommandMode]);
                        if(splitLine[0] === 'load' || splitLine[0] === 'save'){
                            console.log("General Command",splitLine,splitLine.slice(1));
                            commands[splitLine[0]](theShell,splitLine.slice(1));
                        }else{
                            //get the command
                            var command = commands[currentCommandMode][splitLine[0]];
                            if (command !== undefined){
                                //call the command, slicing off the command itself
                                console.log("Calling command:",splitLine[0]);
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

        //generic draw:
        var draw = function(node){
            //validate:
            if(!(node && node.tags && node.tags.type)) throw new Error("Unexpected node");

            //If cwd === node
            if(node.tags.type !== 'rule'){
                console.log("Drawing nodes");
                //setup columns
                var columnWidth = calcWidth(usableWidth,columnNames.node.length);
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
                    console.log("Final Columns:",columns);
                }
                drawNode(node,columnWidth);
            }else if(node.tags.type === "rule"){
                //OTHERWISE: dealing with rules
                console.log("Drawing rules");
                //setup columns
                var columnWidth = calcWidth(usableWidth,columnNames.rule.length);
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
        var drawNode = function(node,columnWidth){
            //validate:
            if(node === undefined){
                throw new Error("DrawNode called on undefined node");
            }
            if(columnWidth === undefined){
                console.warn("No column width specified for drawNode, defaulting to 200");
                columnWidth = 200;
            }
            console.log("Drawing node:",node);
            
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

            console.log("To Draw columns with:",childList,parentList);
            
            drawMultipleNodes('Parents',parentList,columnWidth);
            drawMultipleNodes('Children',childList,columnWidth);
            
        };

        
        /**Renders the current rule 
           @function drawRule
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
            var bound = container.selectAll("text").data(theShell.ruleToStringList(ruleNode));
            //new stuff
            bound.enter().append("text")
                .attr("text-anchor","middle")
                .attr("transform",function(d,i){
                    return "translate(" + (columnWidth * 0.4) + ","
                        + (30 + i * 30) + ")";
                });
            //old stuff
            bound.exit().remove();
            //remaining stuff
            bound.text(function(d){
                return d;
            });
            
            //note: currently draw multiple nodes expected
            //draw node information,bindings,tags, etc
            drawMultipleNodes("conditions",ruleNode.conditions,columnWidth);
            drawMultipleNodes("actions",ruleNode.actions,columnWidth);
            //TODO:
            //drawMultipleNodes("parents",[],columnWidth);
            //drawMultipleNodes("children",[],columnWidth);
        };

        //------------------------------

        /**Draw a column of conditions
           @param baseContainer The container column to use
           @param childArray The array of information to render
           @function drawMultipleNodes
        */
        var drawMultipleNodes = function(baseContainer,childArray,columnWidth){
            console.log("Drawing Column:",baseContainer,childArray);
            console.log("Column Length:",childArray.length);
            
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
            if(baseContainer !== "conditions"){
                return;
            };

            nodes.selectAll(".test").remove();
            
            var testsPerCondition = nodes.selectAll(".test").data(function(d,i){
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
                .classed("test",true)
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

        //------------------------------
        //Startup:
        //------------------------------

        //call the draw command to show the initial state
        console.log("Starting");
        commands.context(theShell);
        //Focus on the text input automatically on page load
        d3.select("#shellInput").node().focus();
        displayHelp(calcWidth(usableWidth,3),helpData['node']);
    }catch(e){
        alert("General Error: \n" + e.message);
        console.log("An Error Occurred:",e);
    };
});
