/**Entry point for shell.html graph authoring program
   @file webMain
*/
require.config({
    paths:{
        "../libs/underscore": "/libs/underscore",
        underscore : "/libs/underscore"
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
require(['libs/d3.min','src/shell','underscore'],function(d3,Shell,_){

    var lastSetOfSearchResults = [];
    
    //Colours:
    var scaleToColour = d3.scale.linear()
        .range([0,20])
        .domain([0,20]);
    var colourScale = d3.scale.category20b();
    
    //The simulated shell:
    var theShell = new Shell();
    
    //Maps typed commands to methods on shell
    var commands = {
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
            request.send(JSON.stringify(sh.nodes,null,"\t"));
        },
        //Make a node
        "n" : function(sh,values){
            return commands["new"](sh,values);
        },
        "new" : function(sh,values){
            if(values[0] === 'child'){
                sh.addChild(values[1],values.slice(2));
            }
            if(values[0] === 'parent'){
                sh.addParent(values[1],values.slice(2));
            }
        },
        //Link a node to a specified node id as a child or parent
        "link" : function(sh,values){
            //Check that an id has been specified
            if(values.length < 2 ||
               isNaN(Number(values[1]))){
                throw new Error("linking needs a node number");
            }
            if(values[0] === "child"){
                sh.link("child",values[1]);
            }
            if(values[0] === "parent") {
                sh.link("parent",values[1]);
            }
        },
        //Change the current node
        "cd" : function(sh,values){
            sh.moveTo(values[0]);
        },
        "root" : function(sh,values){
            sh.moveToRoot();
        },
        "pwd" : function(sh,values){
            displayText(sh.pwd());
        },
        //Delete a child
        "rm" : function(sh,values){
            sh.rm(values);
        },
        //Set,change, or delete cwd value
        "v" : function(sh,values){
            commands.value(sh,values);
        },
        "value": function(sh,values){
            sh.setValue(values);
            //update the values
            drawValues();
        },
        //Rename the current node
        "rename": function(sh,values){
            sh.rename(values);
        },
        "allNodes": function(sh,values){
            console.log(sh.nodes);
        },        
        "context": function(sh,values){
            var context = sh.getContext();
            console.log("Context",context);
            //Create Parent Display
            drawMultipleNodes("#parents",context.parents);
            //Create Child Display
            drawMultipleNodes("#children",context.children);
            //Create Node Display
            drawNode(context.node);

            //TODO: draw common descendents of children
            //or commond ancestors of parents?
            
        },
        "search": function(sh,values){
            //search from anywhere for nodes
            //matching a pattern
            console.log("Searching for:",values);
            var found = sh.search(values);
            console.log("Found: ",found);
            lastSetOfSearchResults = found;
            displayResults(found);
        },
        "refine": function(sh,values){
            console.log("Refining Search");
            var refinedFound = sh.search(values,lastSetOfSearchResults);
            console.log("Refined to:",refinedFound);
            lastSetOfSearchResults = refinedFound;
            displayResults(refinedFound);
        },
        "note": function(sh,values){
            //add values into a note object,
            //separate from values
            sh.setNote(values);
            drawNotes();
        },
        "isolated" : function(sh,values){
            //create a temporary node of all
            //nodes without parents or children
        },
        "cleanup" : function(sh,values){
            //remove from the main node map
            //all nodes that are not part of the main graph
        },
        "next" : function(sh,values){
            sh.moveTo(sh.cwd + 1);
        },
        "prev" : function(sh,values){
            sh.moveTo(sh.cwd - 1);
        }
    };


    //Utility functions:
    var HalfWidth = function(){
        return (window.innerWidth - 10) * 0.5;
    };

    var HalfHeight = function(){
        return (window.innerHeight - 30) * 0.5;
    };

    
    console.log(commands);


    //----------------------------------------
    //Drawing stuff:
    //----------------------------------------

    //The y offset for rectangles so they
    //arent at the very top of the screen
    var drawOffset = 50;
    //The width of the parent, mainnode, and children columns
    var columnWidth = window.innerWidth * 0.25;
    //The height of the bottom supplemental columns
    var supplementalHeight = 300;
    var supplementalWidth = 200;
    
    /*
      Main selection here sets up parsing from input
      and clearing after the user presses enter.
    */
    d3.select('#shellInput').on("keypress",function(e){
        if(d3.event.key === "Enter"){
            var line = d3.select(this).node().value;
            console.log("Command: ",line);
            d3.select(this).node().value = "";
            displayText(line);
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
                displayText(err);
                console.log(err);
            }
          }else if(d3.event.key.length === 1){
            //Otherwise not enter, user is still typing commands:
            var theValue = (d3.select(this).node().value + d3.event.key);
            //Here i could look up potential matches
            displayText(theValue);            
        }

    });

    //Setup the svg for drawing
    var svg = d3.select('body').append('svg')
        .attr('width',window.innerWidth - 10)
        .attr('height',window.innerHeight - 30);

    
    //Node Connections - general groups
    var parents = svg.append("g").attr("id","parents")
        .attr("transform","translate(" +
              ((window.innerWidth * 0.5) - (columnWidth * 0.5) - columnWidth) + ",0)");

    var mainNode = svg.append("g").attr("id","mainNode")
        .attr("transform","translate(" +
              ((window.innerWidth * 0.5) - (columnWidth * 0.5)) + ",0)");
    
    var children = svg.append("g").attr("id","children")
        .attr("transform","translate(" +
              ((window.innerWidth * 0.5) + columnWidth - (columnWidth * 0.5)) + ",0)");

    //Parent Column
    parents.append("text").text("Inputs/Parents")
        .style("text-anchor","middle")
        .attr("transform","translate(100,40)");
    
    parents.append("rect")
        .attr("width",columnWidth)
        .attr("height",window.innerHeight - 200)
        .style("opacity",0.5)
        .attr("rx",10)
        .attr("ry",10)
        .attr("transform","translate(0,"+drawOffset+")");

    //Current Node column
    mainNode.append("text").text("Current Node")
        .attr("transform","translate(100,40)")
        .style("text-anchor","middle");
    
    mainNode.append("rect")
        .attr("width",columnWidth - 20)
        .attr("height",window.innerHeight - 200)
        .attr("rx",10)
        .attr("ry",10)
        .attr("transform","translate(10,"+drawOffset+")");

    //Child column
    children.append("text").text("Outputs/Children")
        .attr("transform","translate(100,40)")
        .style("text-anchor","middle");
    
    children.append("rect")
        .attr("width",columnWidth)
        .attr("height",window.innerHeight - 200)
        .style("opacity",0.5)
        .attr("rx",10)
        .attr("ry",10)
        .attr("transform","translate(0,"+drawOffset+")");


    //Suggestion Box, on the right had side,
    //displays contextual information on what is typed
    var suggestions = svg.append("g")
        .attr("transform",function(){
            return "translate("+ (window.innerWidth - supplementalWidth)+"," + (window.innerHeight - supplementalHeight) + ")";
        });

    suggestions.append("rect")
        .attr("width",columnWidth)
        .attr("height",300)
        .style("fill","black");
       
    suggestions.append("text")
        .style("fill","white")
        .attr("id","suggestions")
        .attr("transform","translate(10,40)");

    //The writes information to the suggestion box
    var displayText = function(text){
        d3.select("#suggestions").text(text);

    };

    //Create and deal with the left supplemental column
    //Typically for displaying results of a search
    var displayResults = function(list){
        console.log("Display Results:",list);
        var resultsBar = d3.select("#resultsBar");
        if(resultsBar.empty()){
            resultsBar = d3.select("svg").append("g")
                .attr("transform",
                      "translate(0," + (window.innerHeight - supplementalHeight) + ")")
                .attr("id","resultsBar");

            resultsBar.append("rect")
                .attr("width",supplementalWidth)
                .attr("height",supplementalHeight);
        }

                
        //Don't bother if theres nothing to draw
        if(list.length < 1){
            console.log("quitting display results early",list);
            d3.select("#resultsBar").select("rect")
                .transition()
                .attr("height",0);                    
            d3.select("#resultsBar").selectAll("text")
                .remove();
            
            return;
        }

        d3.select("#resultsBar").select("rect")
            .transition()
            .attr("height",supplementalHeight);
        
        var lines = resultsBar.selectAll("text").data(list,function(d){
            return d.id;
        });

        lines.exit().remove();
        
        lines.enter().append("text")
            .text(function(d){
                return (d.id + " : " + d.name);
            })
            .style("fill","white");

        lines.attr("transform",function(d,i){
                return "translate(10,"+ (40 + (i * 20)) + ")";
        });

        
        
    };
    
    /**Renders the current Node 
       @function drawNode
    */
    var drawNode = function(node){
        //Set colour range
        //scaleToColour.domain(d3.extent(_.values(node),function(d){
        //return _.values(d.children).length;
        //}));
        var mainNode = svg.select("#mainNode");
        //bind data
        var theNode = mainNode.selectAll("g").data([node],function(d){
            return d.id;
        });
        //remove old data
        theNode.exit().remove();

        //Add visualisation
        var container = theNode.enter().append("g")
            .attr("transform","translate(" +
                  (columnWidth * 0.1)+ ","+(drawOffset + 20)+")")
            .attr("id","mainNodeInfo");
        
        container.append("rect")
            .style("fill",function(d){
                return colourScale(scaleToColour(_.values(d.children).length));
            })
            .attr("width",(columnWidth * 0.8))
            .attr("height","500")
            .attr("rx",10)
            .attr("ry",10);

        container.append("text")
            .attr("transform","translate(" + ((columnWidth * 0.4)) + ",15)")
            .style("text-anchor","middle")
            .text(function(d){
                return "ID:"+d.id;
            });
        
        container.append("text")
            .attr("transform","translate(" + ((columnWidth * 0.4)) + ",30)")
            .style("text-anchor","middle")
            .text(function(d){
                return d.name;
            });

        //separate function to be able to update
        //value text separately
        drawValues();
        drawNotes();
        

    };

    /**Render the values of the current node
       @function drawValues
    */
    var drawValues = function(){
        //console.log("Drawing values");
        //console.log(theShell.getCwd().valueArray());

        //Select the "g"
        var valueContainer = svg.select("#valueContainer");
        //If it doesnt exist, create it
        if(valueContainer.empty()){
            //console.log("value container empty, creating");
            valueContainer = svg.select("#mainNodeInfo")
                .append("g")
                .attr('id','valueContainer')
                .attr("transform","translate(" + (columnWidth * 0.4)+",50)");

        }

        //Remove old text
        valueContainer.selectAll("text").remove();

        
        //bind new texts
        //Values are stored in a node as an object,
        //.valueArray() converts it to an array of pairs
        var texts = valueContainer.selectAll("text")
            .data(theShell.getCwd().valueArray());

        
        texts.enter().append("text")
            .text(function(d){
                return d[0] + ": " + d[1];
            })
            .style("text-anchor","middle")
            .attr("transform",function(d,i){
                return "translate(0," + (i * 20) + ")";
            });

        texts.exit().remove();
    };


    /**Render the Notes of the current node
       @function drawNotes
    */
    var drawNotes = function(){
        //console.log("Drawing notes");

        //Select the "g"
        var valueContainer = svg.select("#noteContainer");
        //If it doesnt exist, create it
        if(valueContainer.empty()){
            //console.log("value container empty, creating");
            valueContainer = svg.select("#mainNodeInfo")
                .append("g")
                .attr('id','noteContainer')
                .attr("transform","translate(" + (columnWidth * 0.4)+",120)");

        }

        //Remove old text
        valueContainer.selectAll("text").remove();

        
        //bind new texts
        //Values are stored in a node as an object,
        //.valueArray() converts it to an array of pairs
        var texts = valueContainer.selectAll("text")
            .data(theShell.getCwd().noteArray());

        
        texts.enter().append("text")
            .text(function(d){
                return d[0] + ": " + d[1];
            })
            .style("text-anchor","middle")
            .attr("transform",function(d,i){
                return "translate(0," + (i * 20) + ")";
            });

        texts.exit().remove();
    };

    
    /**Draw a column of nodes
       @param baseContainer The container column to use
       @param childArray The array of nodes to render
       @function drawMultipleNodes
    */
    var drawMultipleNodes = function(baseContainer,childArray){
        //set colours:
        //scaleToColour.domain(d3.extent(childArray,function(d){
        //    return _.values(d.children).length;
        //}));
        
        var childNode = svg.select(baseContainer);
        d3.select(baseContainer).selectAll(".node").remove();
        var heightAvailable = d3.select(baseContainer).select("rect").attr("height");
        heightAvailable -= 20; //-20 for top and bottom
        //console.log("Drawing array:",childArray);
        var nodes = childNode.selectAll("g")
            .data(childArray,
                  function(d){
                      return d.id + "_node";
                  });

        drawOffSet = 10; 
        
        var inodes = nodes.enter().append("g")
            .attr("transform",function(d,i){
                //console.log("Drawing inode:",d.id,i);
                return "translate(0," + (drawOffset +(i * (heightAvailable / childArray.length))) + ")";
            })
            .attr('id',function(d){
                return d.id + "_node";
            })
            .classed("node",true);
        
        inodes.append("rect")
            .style("fill",function(d){
                return colourScale(scaleToColour(_.values(d.children).length));
            })
            .attr("width",(columnWidth * 0.5))
            .attr("transform","translate(" + (columnWidth * 0.25)+ ",0)")
            .attr("height",(heightAvailable / childArray.length) - 5)
            .attr("rx",10)
            .attr("ry",10);
        
        inodes.append("text")
            .style("text-anchor","middle")
            .attr("transform","translate(" + (columnWidth * 0.5)+",20)")
            .text(function(d){
                return "(" + d.id + "): " + d.name;
            });
        
        nodes.exit().remove();
        
    };


    //Startup:
    commands.context(theShell);
    //Focus on the text input automatically on page load
    d3.select("#shellInput").node().focus();

});
