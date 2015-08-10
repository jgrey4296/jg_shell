/**Entry point for shell.html graph authoring program
   @file webMain
 */
require.config({
    paths:{
        underscore: "/libs/underscore"
    },
    shim:{
        underscore:{
            exports:'_'
        },
    }

});

/*
  Creates a single shell instance, a command map,
  and then the authoring environment d3 drawing code
*/
require(['libs/d3.min','src/shell'],function(d3,Shell,_){

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
                        commands['context'](theShell);
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
        "new" : function(sh,values){
            if(values[0] === 'child'){
                sh.addChild(values[1],values.slice(2));
            }
            if(values[0] === 'parent'){
                sh.addParent(values[1],values.slice(2));
            }
        },
        //Change the current node
        "cd" : function(sh,values){
            sh.moveTo(values[0]);
        },
        "root" : function(sh,value){
            sh.moveToRoot();
        },
        //Goto a node by id:
        "goto":function(sh,values){
            sh.moveTo(values);
        },
        "pwd" : function(sh,values){
            displayText(sh.pwd());
        },
        //Delete a child
        "rm" : function(sh,values){
            sh.rm(values);
        },
        //Set,change, or delete cwd value
        "value":function(sh,values){
            if(values.length < 1){
                console.log(sh.getCwd().values);
                return;
            }

            sh.setValue(values);
            //update the values
            drawValues();
        },
        //Rename the current node
        "rename":function(sh,values){
            sh.rename(values);
        },
        "allNodes":function(sh){
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

    /*
      Main selection here sets up parsing from input
      and clearing after the user presses enter.
     */
    d3.select('#shellInput').on("keypress",function(e){
        if(d3.event.key === "Enter"){
            var line = d3.select(this).node().value;
            console.log(line);
            d3.select(this).node().value = "";
            displayText(line);
            
            if (line !== null){
                var splitLine = line.trim().split(" ");
                var command = commands[splitLine[0]];
                if (command !== undefined){
                    command(theShell,splitLine.slice(1));
                }else{
                    console.log("unrecognised command: " + splitLine[0]);
                }
                commands['context'](theShell);
            }
        //Otherwise not enter, user is still typing commands:
        }else if(d3.event.key.length === 1){
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
            return "translate("+ (window.innerWidth - 200)
                +"," + (window.innerHeight - 300) + ")";
        });

    suggestions.append("rect")
        .attr("width",columnWidth)
        .attr("height",300)
        .style("fill","black")
        .attr("rx",10)
        .attr("ry",10);

    suggestions.append("text")
        .style("fill","white")
        .attr("id","suggestions")
        .attr("transform","translate(10,40)");

    //The writes information to the suggestion box
    var displayText = function(text){
        d3.select("#suggestions").text(text);

    };

    /**Renders the current Node 
       @function drawNode
     */
    var drawNode = function(node){
        //Select
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
                  (columnWidth * 0.25)+ ","+(drawOffset + 20)+")")
            .attr("id","mainNodeInfo");
        
        container.append("rect")
            .style("fill","red")
            .attr("width",(columnWidth * 0.5))
            .attr("height","500")
            .attr("rx",10)
            .attr("ry",10);

        container.append("text")
            .attr("transform","translate("
                  + ((columnWidth * 0.25)) + ",15)")
            .style("text-anchor","middle")
            .text(function(d){
                return "ID:"+d.id;
            });
        
        container.append("text")
            .attr("transform","translate("
                  + ((columnWidth * 0.25)) + ",30)")
            .style("text-anchor","middle")
            .text(function(d){
                return d.name;
            });

        //separate function to be able to update
        //value text separately
        drawValues();
        

    };

    /**Render the values of the current node
       @function drawValues
     */
    var drawValues = function(){
        console.log("Drawing values");
        console.log(theShell.getCwd().valueArray());

        //Select the "g"
        var valueContainer = svg.select("#valueContainer");
        //If it doesnt exist, create it
        if(valueContainer.empty()){
            console.log("value container empty, creating");
            valueContainer = svg.select("#mainNodeInfo")
                .append("g")
                .attr('id','valueContainer')
                .attr("transform","translate("
                      + (columnWidth * 0.25)+",50)");

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
    
    /**Draw a column of nodes
       @param baseContainer The container column to use
       @param childArray The array of nodes to render
       @function drawMultipleNodes
     */
    var drawMultipleNodes = function(baseContainer,childArray){
        var childNode = svg.select(baseContainer);
        var nodes = childNode.selectAll("g")
            .data(childArray,
                  function(d){
                      return d.id;
                  });

        var inodes = nodes.enter().append("g")
            .attr("transform",function(d,i){
                return "translate(0," + (drawOffset + 20 + (i * 125)) +")";
            })
            .attr('id',function(d){
                return d.id + "_node";
            });

        inodes.append("rect")
            .style("fill","red")
            .attr("width",(columnWidth * 0.5))
            .attr("transform","translate("
                  + (columnWidth * 0.25)+ ",0)")
            .attr("height","100")
            .attr("rx",10)
            .attr("ry",10);

        inodes.append("text")
            .style("text-anchor","middle")
            .attr("transform","translate("
                  + ((columnWidth * 0.5))+",50)")
            .text(function(d){
            return d.name;
            });

        nodes.exit().remove();
        
    };


    //Startup:
    commands['context'](theShell);
    //Focus on the text input automatically on page load
    d3.select("#shellInput").node().focus();

});
