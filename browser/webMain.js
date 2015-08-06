
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

require(['libs/d3.min','src/shell'],function(d3,Shell,_){

    //The simulated shell:
    var theShell = new Shell();
    
    //Maps typed commands to methods on shell
    var commands = {
        "load" : function(sh,values){
            var request = new XMLHttpRequest();
            request.onreadystatechange=function(){
                //TODO: when file is recieved
                if(request.readyState===4){
                    console.log("Received");
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
        "mkdir" : function(sh,values){
            sh.mkdir(values[0],values.slice(1));
        },
        "cd" : function(sh,values){
            sh.changeDir(values[0]);
        },
        "pwd" : function(sh,values){
            displayText(sh.pwd());
        },
        "rm" : function(sh,values){
            sh.rm(values);
        },
        "ls" : function(sh,values){
            displayText(sh.ls(values));
        },
        "value":function(sh,values){
            if(values.length < 1){
                console.log(sh.getCwd().values);
                return;
            }

            sh.setValue(values);
            drawValues();
        },
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


    //--------------------
    //Drawing stuff:
    var drawOffset = 50;

    
    //Focus on the text input on load
    d3.select("#shellInput").node().focus();
    
    //Setup the text input and parsing
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

    
    //Node Connections
    var columnWidth = 200;
    
    var parents = svg.append("g").attr("id","parents")
        .attr("transform","translate(" +
              ((window.innerWidth / 3) - (columnWidth * 0.5)) + ",0)");

    var mainNode = svg.append("g").attr("id","mainNode")
        .attr("transform","translate(" +
              ((window.innerWidth / 2) - (columnWidth * 0.5)) + ",0)");
    
    var children = svg.append("g").attr("id","children")
            .attr("transform","translate(" +
                  (((window.innerWidth / 3) * 2) - (columnWidth * 0.5)) + ",0)");

    
    parents.append("text").text("Inputs/Parents")
        .style("text-anchor","middle")
        .attr("transform","translate(100,40)");
    
    parents.append("rect")
        .attr("width",200)
        .attr("height",window.innerHeight - 200)
        .style("opacity",0.5)
        .attr("rx",10)
        .attr("ry",10)
        .attr("transform","translate(0,"+drawOffset+")");

    mainNode.append("text").text("Current Node")
        .attr("transform","translate(100,40)")
        .style("text-anchor","middle");
    
    mainNode.append("rect")
        .attr("width",200)
        .attr("height",window.innerHeight - 200)
        .attr("rx",10)
        .attr("ry",10)
        .attr("transform","translate(0,"+drawOffset+")");

    children.append("text").text("Outputs/Children")
        .attr("transform","translate(100,40)")
        .style("text-anchor","middle");
    
    children.append("rect")
        .attr("width",200)
        .attr("height",window.innerHeight - 200)
        .style("opacity",0.5)
        .attr("rx",10)
        .attr("ry",10)
        .attr("transform","translate(0,"+drawOffset+")");


    //Suggestion Box
    var suggestions = svg.append("g")
        .attr("transform",function(){
            return "translate("+ (window.innerWidth - 200) +",0)";
        });

    suggestions.append("rect")
        .attr("width",200)
        .attr("height",300)
        .style("fill","black")
        .attr("rx",10)
        .attr("ry",10);

    suggestions.append("text")
        .style("fill","white")
        .attr("id","suggestions")
        .attr("transform","translate(10,40)");

    var displayText = function(text){
        d3.select("#suggestions").text(text);

    };

    /**Renders the current Node 
       @function drawNode
     */
    var drawNode = function(node){
        var mainNode = svg.select("#mainNode");
        var theNode = mainNode.selectAll("g").data([node],function(d){
            return d.id;
        });
        theNode.exit().remove();
        
        var container = theNode.enter().append("g")
            .attr("transform","translate(25,"+(drawOffset + 20)+")")
            .attr("id","mainNodeInfo");
        
        container.append("rect")
            .style("fill","red")
            .attr("width","150")
            .attr("height","500")
            .attr("rx",10)
            .attr("ry",10);

        container.append("text")
            .attr("transform","translate(75,20)")
            .style("text-anchor","middle")
            .text(function(d){
                return d.name;
            });


        drawValues();
        

    };

    var drawValues = function(){
        console.log("Drawing values");
        console.log(theShell.getCwd().valueArray());

        var valueContainer = svg.select("#valueContainer");
        if(valueContainer.empty()){
            console.log("value container empty, creating");
            valueContainer = svg.select("#mainNodeInfo")
                .append("g")
                .attr('id','valueContainer')
                .attr("transform","translate(75,40)");
        }

        valueContainer.selectAll("text").remove();

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
            });

        inodes.append("rect")
            .style("fill","red")
            .attr("width","125")
            .attr("transform","translate(25,0)")
            .attr("height","100")
            .attr("rx",10)
            .attr("ry",10);

        inodes.append("text")
            .attr("transform","translate(50,50)")
            .text(function(d){
            return d.name;
            });


        nodes.exit().remove();
        
    };


    //Startup:
    commands['context'](theShell);
});
