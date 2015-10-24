/**Entry point for shell.html graph authoring program
   @file webMain
*/
require.config({
    baseUrl: "/js",
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
        var valueCheck = function(list,requiredLength,command){
            if(list.length !== requiredLength){
                throw new Error("Incorrect number of arguments: " + command);
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
                sh.addNode(target,values[1],values[2]);
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
                sh.addNode('children',chars[values[0]],values[1]);
            },
            "np" : function(sh,values){
                var chars = {
                    "n" : "node",
                    "i" : "institution",
                    "r" : "role",
                    "a" : "activity",
                    "rc": "rulecontainer",
                };
                sh.addNode('parents',chars[values[0]],values[1]);
            },
            //New Child Node, ncn:
            "ncn" : function(sh,values){
                sh.addNode('children','node',values[0]);
            },
            //new child institution: nci
            "nci" : function(sh,values){
                sh.addNode('children','institution',values[0]);
            },
            //new role

            //new activity

            //new rule container

            //new rule
            
            //rm -> removeNode,
            "rm" : function(sh,values){
                sh.rm(values[0]);
            },
            //cd -> cd
            "cd" : function(sh,values){
                valueCheck(values,1,values);
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
            "prev" : function(sh,value){
                sh.cd(sh.previousLocation);
            },
        };

        var ruleCommands = {
            //new -> addRule,
            "new" : function(sh,values){

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
                            console.log("JSON:",receivedJson);
                            sh.loadJson(receivedJson);
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
                var request = new XMLHttpRequest();
                request.onreadystatechange=function(){
                    if (request.readyState===4){
                        console.log("Finished");
                        console.log(request.responseText);
                    }
                };
                request.open("POST","saveData="+values[0],true);
                request.send(sh.exportToJson());
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
                "nc"    : "[n|i|r|a|rc] $name",
                "[ncn | nci]" : "$name",
                "rm"    : "$id",
                "cd"    : "[.. | $name | $id]",
                "rename": "$name",
                "set"   : "$field $parameter $value",
                "stash" : "",
                "unstash":"",
                "top" : "",
                "prev" : "",
            },
            rule : {


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
            var helpText = [["Available Commands ",""]].concat(_.pairs(helpDataSubGrammar));
            if(columnWidth === undefined){
                console.warn("No columnWidth provided to displayHelp, assuming 200");
                columnWidth = 200;
            }
            var helpSize = 300;
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
            var boundSelection = helpWindow.selectAll("text").data(helpText,function(d){return d[1];});

            boundSelection.enter()
                .append("text")
                .style("text-anchor","middle")
                .style("fill","white");
            
            boundSelection.attr("transform",function(d,i){
                    return "translate("+ (columnWidth * 0.5) + "," + (30 + i * 20) +")";
                })
                .text(function(d){
                    return d[0] + ": " + d[1];
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
        d3.select('#shellInput').on("keypress",function(e){
            if(d3.event.key === "Enter"){
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
                        var commandMode = "node";
                        //shift to rule view when appropriate
                        if(theShell.cwd.tags.type === "Rule"
                          || theShell.cwd.tags.type === "RuleContainer"){
                            commandMode = "rule";
                        };
                        console.log("Command mode: ", commandMode, "Commands: ", columnNames[commandMode]);
                        //get the command
                        var command = commands[commandMode][splitLine[0]];
                        if (command !== undefined){
                            //call the command, slicing off the command itself
                            console.log("Calling command:",splitLine[0]);
                            command(theShell,splitLine.slice(1));
                        }else{
                            console.log("unrecognised command: " + splitLine[0]);
                        }
                        console.log("Shell cwd state:",theShell.cwd);
                        commands.context(theShell);
                        //recheck the command type for displaying help
                        if(theShell.cwd.tags.type === "Rule"
                          || theShell.cwd.tags.type === "RuleContainer"){
                            commandMode = "rule";
                        }else{
                            commandMode = "node";
                        }                        
                        displayHelp(calcWidth(usableWidth,_.values(columnNames[commandMode]).length), helpData[commandMode]);

                    }
                }catch(err){
                    alert("Input error: \n" + err.message);
                    console.log("Input Error:",err);
                }
            }else if(d3.event.key.length === 1){
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
            if(node.tags.type !== 'Rule' && node.tags.type !== 'RuleContainer'){
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
            }else if(node.tags.type === "Rule" | node.tags.type === "RuleContainer"){
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
            
            //draw the rectangle
            theNode.append("rect")
                .attr("width",(columnWidth * 0.8))
                .attr("height",300)
                .attr("rx",10)
                .attr("ry",10);

            //draw the text of the node
            var nodeInternalText  = node.getLists(["id","name","values","tags","annotations"]);
            
            var boundText = theNode.selectAll("text").data(nodeInternalText);

            boundText.exit().remove();
            
            boundText.enter().append("text")
                .attr("transform",function(d,i){
                    return "translate(" + (columnWidth * 0.4) + "," + (15 + i * 15) + ")";
                })
                .style("text-anchor","middle")
                .style("fill","white");

            //this should be in the update selection?
            boundText.text(function(d,i){
                return d;
            });

            var childList = _.values(node.children);
            var parentList = _.values(node.parents);

            drawMultipleNodes('Parents',parentList,columnWidth);
            drawMultipleNodes('Children',childList,columnWidth);
            
        };

        
        /**Renders the current rule 
           @function drawRule
           @param rule The Rule object to render
        */
        var drawRule = function(rule,columnWidth){
            if(rule === undefined){
                //Cleanup
                d3.select("#Rule").select("#mainRuleInfo").remove();
                return;
            }
            if(columnWidth === undefined){
                console.warn("No column width specified for drawRule, defaulting to 200");
                columnWidth = 200;
            }
            console.log("Drawing:",rule);
            var ruleContainer = svg.select("#Rule");
            //bind data
            var bound = ruleContainer.selectAll("g").data([rule],function(d){
                return d.id;
            });
            //remove old data?
            bound.exit().remove();

            //Add a container to draw the rule's information in
            var container = bound.enter().append("g")
                .attr("transform","translate(" +
                      (columnWidth * 0.1)+ ","+(drawOffset + 20)+")")
                .attr("id","mainRuleInfo");

            //draw the parent NODE of the graph

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


            //note: currently draw multiple nodes expected
            
            //draw node information,bindings,tags, etc
            

            //drawMultipleNodes("Conditions",theShell.cwd.getConditionNodes(),columnwidth);
            //drawMultipleNodes("Actions",theShell.cwd.getActionNodes(),columnWidth);
            //TODO:
            //drawMultipleNodes("parents",[],columnWidth);
            //drawMultipleNodes("children",[],columnWidth);
        };

        /**Draw a column of conditions
           @param baseContainer The container column to use
           @param childArray The array of information to render
           @function drawMultipleNodes
        */
        var drawMultipleNodes = function(baseContainer,childArray,columnWidth){
            //console.log("Drawing Column:",baseContainer,childArray);
            
            var containingNode = getColumnObject(baseContainer);
            //clean the container
            containingNode.selectAll(".node").remove();

            if(childArray.length === 0){
                return;
            }

            
            var heightAvailable = containingNode.select("rect").attr("height");
            heightAvailable -= 20; //-20 for top and bottom
            //bind the data
            var nodes = containingNode.selectAll("g")
                .data(childArray,
                      function(d){
                          //using custom id's
                          return d.id + "_node";
                      });

            drawOffSet = 10; 

            //create each node
            var inodes = nodes.enter().append("g")
                .attr("transform",function(d,i){
                    //console.log("Drawing inode:",d.id,i);
                    return "translate(0," + (drawOffset +(i * (heightAvailable / childArray.length))) + ")";
                })
                .attr('id',function(d){
                    return d.id + "_node";
                })
                .classed("node",true);

            //Draw a rectangle for the node
            inodes.append("rect")
                .style("fill",function(d){
                    return colourScale(scaleToColour(_.values(d.constantTests).length));
                })
                .attr("width",(columnWidth * 0.8))
                .attr("transform","translate(" + (columnWidth * 0.1)+ ",10)")
                .attr("height",(heightAvailable / childArray.length) - 5)
                .attr("rx",10)
                .attr("ry",10);

            //Draw the nodes text
            inodes.append("text")
                .style("text-anchor","middle")
                .attr("transform","translate(" + (columnWidth * 0.5)+",30)")
                .text(function(d){
                    return "(" + d.id + "): " + d.name + " (" + d.tags.type + ")";
                });

            //Draw values:
            var subText = inodes.append("g")
                .classed("nodeSubText",true)
                .attr("transform","translate(" + (columnWidth * 0.5) + ",45)");

            var boundText = subText.selectAll("text").data(function(d){
                return d.values;
            });
            
            boundText.enter().append("text")
                .attr("text-anchor","middle")
                .attr("transform",function(d,i){
                    return "translate(0," + (i * 20) + ")";
                })
                .text(function(d){
                    return d;
                });

            
            //remove any old nodes
            nodes.exit().remove();
            
        };


        //Startup:
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
