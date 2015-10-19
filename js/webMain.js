/**Entry point for shell.html graph authoring program
   @file webMain
*/
require.config({
    paths:{
        "../libs/underscore": "/libs/underscore",
        underscore : "/libs/underscore",
        ReteDataStructures : '/libs/ReteDataStructures',
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
require(['libs/d3.min','src/ruleCreator','underscore'],function(d3,Shell,_){
    console.log("Starting Rule Authoring Shell");
    var lastSetOfSearchResults = [];
    
    //COLOURS:
    var scaleToColour = d3.scale.linear()
        .range([0,20])
        .domain([0,20]);
    var colourScale = d3.scale.category20b();
    
    //The simulated shell:
    var theShell = new Shell();
    
    //Maps typed commands to methods on shell
    var commands = {
    //     //Load a file from the server
    //     "load" : function(sh,values){
    //         var request = new XMLHttpRequest();
    //         request.onreadystatechange=function(){
    //             if(request.readyState===4){
    //                 try{
    //                     var receivedJson = JSON.parse(request.responseText);
    //                     console.log("JSON:",receivedJson);
    //                     sh.loadJson(receivedJson);
    //                     commands.context(theShell);
    //                 }catch(err){
    //                     console.log("Error loading data:",err);
    //                 }
    //             }
    //         };
    //         request.open("GET","/data/"+values[0]+".json",true);
    //         request.send();
    //     },
    //     //Save the current graph to the server
    //     "save" : function(sh,values){
    //         var request = new XMLHttpRequest();
    //         request.onreadystatechange=function(){
    //             if (request.readyState===4){
    //                 console.log("Finished");
    //                 console.log(request.responseText);
    //             }
    //         };
    //         request.open("POST","saveData="+values[0],true);
    //         request.send(sh.exportToJson());
    //     },
        //Create new elements
        "new" : function(sh,values){
            console.log("New: ",values);
            if(values[0] === 'rule'){
                sh.addRule(values[1]);
            }else if(values[0] === 'condition'){
                sh.addCondition();
            }else if(values[0] === 'binding'){
                sh.addBinding(values[1],values.slice(2));
            }else if(values[0] === 'test'){
                sh.addTestToCondition(values[1],values.slice(2));
            }else if(values[0] === 'action'){
                sh.addAction(values.slice(1));
            }else if(values[0] === 'actionValue'){
                sh.specifyAction(values[1],values.slice(2);
            }
            }else{
                console.log("Unrecognised new command");
            }
        },
        //move by id or name, as necessary, to OTHER RULES ONLY
        "cd" : function(sh,values){
            //If an ID is passed in:
            if(!isNaN(Number(values[0]))
               && sh.allRulesById[Number(values[0])] !== undefined){
                sh.cwr = sh.allRulesById[Number(values[0])];
            //else by name
            }else if(sh.allRulesByName[values[0]] !== undefined){
                sh.cwr = sh.allRulesByName[values[0]];
            }else{
                console.log("Unrecognised rule to move to");
            }                
        },
        //TODO:Delete a rule/action/condition/test
        "rm" : function(sh,values){
            if(values[0] === "rule"){
                sh.removeRule();
            }else if(values[0] === "action"){
                sh.removeAction(values[1]);
            }else if(values[0] === "condition"){
                sh.removeCondition(values[1]);
            }else if(values[0] === "test"){
                sh.removeTest(values[1],values[2]);
            }else if(values[0] === "binding"){
                sh.removeBinding(values[1],values[2]);
            }else{
                console.log("Unrecognised removal target");
            }
        },
        "rename": function(sh,values){
            if(values.length !== 1) throw new Error("Renaming should take a single value");
            console.log("Renaming to:",values);
            //remove the old name
            delete sh.allRulesByName[sh.cwr.name];
            //update the rules name
            sh.cwr.name = values[0];
            //re-store it with its new name
            sh.allRulesByName[sh.cwr.name] = sh.cwr;
            //update the visualisation
            d3.select("#ruleNameText").text(function(d){
                return "Name: " + d.name;
            });
        },
        //     //List all rules
        //     "allRules": function(sh,values){
        //     },

        
        //Get the context of a rule
        //ie: get the rule, get its conditions,
        //get its conditions tests
        //get its actions
        "context": function(sh,values){
            console.log("Getting context");
            drawRule(sh.cwr);
        },
    //     //Search for a rule/condition/test/action
    //     "search": function(sh,values){

    //     },
        //tag a rule
        "tag": function(sh,values){
            if(values[0] === "rule"){
                values.slice(1).map(function(d){
                    sh.cwr.tags[d] = true;
                });
            }else if(values[0] === 'action'
                     && !isNaN(Number(values[1]))){
                var action = sh.cwr.actions[Number(values[1])];
                if(action){
                    values.slice(2).map(function(d){
                        action.tags[d] = true;
                    });
                }
            }
        },
        "untag" : function(sh,values){
            if(values[0] === 'rule'){
                values.slice(1).map(function(d){
                    delete sh.cwr.tags[d];
                });
            }else if(values[0] === 'action'
                     && !isNaN(Number(values[1]))){
                var action = sh.cwr.actions[Number(values[1])];
                if(action){
                    values.slice(2).map(function(d){
                        delete action.tags[d];
                    });
                }
            }
            drawValues();
        },
        
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
        //Display help dialog
        "help" : function(sh,values){
            //create a tab showing all commands that can be called
        },
    };
    console.log(commands);

    //Utility functions:
    var HalfWidth = function(){
        return (window.innerWidth - 10) * 0.5;
    };

    var HalfHeight = function(){
        return (window.innerHeight - 30) * 0.5;
    };


    //----------------------------------------
    //Drawing stuff:
    //----------------------------------------
    console.log("Initialising Drawing variables");
    //The y offset for rectangles so they
    //arent at the very top of the screen
    var drawOffset = 50;
    //The height of the bottom supplemental columns
    var supplementalHeight = 300;
    var supplementalWidth = 200;
    var usableWidth = window.innerWidth - 10;
    var columnNames = ["ParentRules","Conditions","Rule","Actions","DependentRules"];
    var columnLookup = {};
    columnNames.map(function(d,i){
        columnLookup[d] = i;
    });
    var noOfColumns = columnNames.length;
    var calcWidth = function(availableWidth,noOfColumns){
        return (availableWidth / (noOfColumns + 2))
    };
    var columnWidth = calcWidth(usableWidth,noOfColumns);    

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
            //Get the text
            var line = d3.select(this).node().value;
            console.log("Command: ",line);
            d3.select(this).node().value = "";
            //Attempt to call a command using the text
            try{
                if (line !== null){
                    var splitLine = line.trim().split(" ");
                    var command = commands[splitLine[0]];
                    if (command !== undefined){
                        command(theShell,splitLine.slice(1));
                    }else{
                        console.log("unrecognised command: " + splitLine[0]);
                    }
                    commands.context(theShell);
                }
            }catch(err){
                console.log("Error:",err);
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
    
    //Setup the svg for drawing
    var svg = d3.select('body').append('svg')
        .attr('width',usableWidth)
        .attr('height',window.innerHeight - 30);

    //tests -> conditions -> rule/bindings/notes -> actions -> assertions
    var columnPosition = function(availableWidth,noOfColumns,columnNumber){
        var oneColWidth = calcWidth(availableWidth,noOfColumns);
        return oneColWidth + (oneColWidth * columnNumber);
    };

    var initColumn = function(name,columnNumber){
        var newColumn = svg.append("g").attr("id",name)
        .attr("transform","translate(" +
              columnPosition(usableWidth,noOfColumns,columnNumber) + ",0)");

        //display a title for the column
        newColumn.append("text").text(name)
            .style("text-anchor","middle")
            .attr("transform","translate("+(columnWidth * 0.5)+",40)");

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

    console.log("Setting up columns");
    //create the columns
    var columns = columnNames.map(function(d,i){
        return initColumn(d,i);
    });

    var getColumnObject = function(columnName){
        if(columnLookup[columnName] === undefined){
            throw new Error("Unrecognised Column Name:" + columnName);
        }
        return columns[columnLookup[columnName]];
    };
    
    
    /**Renders the current rule 
       @function drawRule
       @param rule The Rule object to render
    */
    var drawRule = function(rule){
        if(rule === undefined){
            //Cleanup
            d3.select("#Rule").select("#mainRuleInfo").remove();
            return;
        }else{
            //a data array of 1
            rule = [rule];
        }
        console.log("Drawing:",rule);
        
        var ruleContainer = svg.select("#Rule");
        //bind data
        var theNode = ruleContainer.selectAll("g").data(rule,function(d){
            return d.id;
        });
        //remove old data?
        theNode.exit().remove();

        //Add a container to draw the rule's information in
        var container = theNode.enter().append("g")
            .attr("transform","translate(" +
                  (columnWidth * 0.1)+ ","+(drawOffset + 20)+")")
            .attr("id","mainRuleInfo");

        //make it visible:
        container.append("rect")
            .style("fill",function(d){
                //TODO: colour by something else?
                return colourScale(scaleToColour(_.values(d.conditions).length));
            })
            .attr("width",(columnWidth * 0.8))//not as wide as the container
            .attr("height","500")
            .attr("rx",10)
            .attr("ry",10);

        //Draw the id number
        container.append("text")
        //translate over by half the rects width, not the column width
            .attr("transform","translate(" + ((columnWidth * 0.4)) + ",15)")
            .style("text-anchor","middle")
            .text(function(d){
                return "ID:" + d.id;
            });

        //draw the rule name
        container.append("text")
            .attr("transform","translate(" + ((columnWidth * 0.4)) + ",30)")
            .style("text-anchor","middle")
            .text(function(d){
                return "Name: " + d.name;
            })
            .attr("id","ruleNameText");

        //TODO: draw bindings

        //TODO: draw tags
        

        
        
        //separate function to be able to update
        //value text separately
        drawValues();
        drawMultipleNodes("Conditions",theShell.cwr.getConditionNodes());
        drawMultipleNodes("Actions",theShell.cwr.getActionNodes());
        //TODO:
        drawMultipleNodes("ParentRules",[]);
        drawMultipleNodes("DependentRules",[]);
    };

    /**Render the values of the current rule
       Most likely the bindings
       @function drawValues
    */
    var drawValues = function(){
        if(theShell.cwr === undefined) return;
        //if(theShell.cwr.getBindingsArray().length === 0) return;
        console.log("Drawing values");
        
        //Select the "g"
        var valueContainer = svg.select("#valueContainer");
        //If it doesnt exist, create it
        if(valueContainer.empty()){
            valueContainer = svg.select("#mainRuleInfo")
                .append("g")
                .attr('id','valueContainer')
                .attr("transform","translate(" + (columnWidth * 0.4)+",50)");
        }

        //Remove old text
        valueContainer.selectAll("text").remove();
        
        //bind new texts
        var bindings = ["All Bound Vars: "].concat(theShell.cwr.getBindingsArray());
        var tags = ["Tags:"].concat(Object.keys(theShell.cwr.tags));


        var allValues = bindings.concat(tags);
        console.log("Values for rule:",allValues);
        //Values are stored in a node as an object,
        //.valueArray() converts it to an array of pairs
        var texts = valueContainer.selectAll("text")
            .data(allValues);
        
        texts.enter().append("text")
            .text(function(d){
                return d;
            })
            .style("text-anchor","middle")
            .attr("transform",function(d,i){
                return "translate(0," + (i * 20) + ")";
            });
        texts.exit().remove();
    };


    /**Draw a column of conditions
       @param baseContainer The container column to use
       @param childArray The array of information to render
       @function drawMultipleNodes
    */
    var drawMultipleNodes = function(baseContainer,childArray){
        console.log("Drawing Column:",baseContainer,childArray);
        
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
                return "(" + d.id + "): ";
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

});
