
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
        "save" : function(sh,values){
            var request = new XMLHttpRequest();
            request.onreadystatechange=function(){
                if (request.readyState==4){
                    console.log("Finished");
                    console.log(request.responseText);
                }
            };
            request.open("POST","",true);
            request.send("this is a test");
        },
        "mkdir" : function(sh,values){
            sh.mkdir(values[0],values.slice(1));
            commands['context'](sh,values);
        },
        "cd" : function(sh,values){
            sh.changeDir(values[0]);
            commands['context'](sh,values);
        },
        "pwd" : function(sh,values){
            displayText(sh.pwd());
        },
        "rm" : function(sh,values){
            console.log("TODO: rm");
        },
        "ls" : function(sh,values){
            displayText(sh.ls(values));
            commands['context'](sh,values);
        },
        "context": function(sh,values){
            var context = sh.getContext();
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
    var parents = svg.append("g").attr("id","parents")
        .attr("transform","translate(" +
                  ((window.innerWidth / 3) - 100) + ",0)");

    var mainNode = svg.append("g").attr("id","mainNode")
        .attr("transform","translate(" +
              ((window.innerWidth / 2) - 100) + ",0)");
    
    var children = svg.append("g").attr("id","children")
            .attr("transform","translate(" +
                  (((window.innerWidth / 3) * 2) - 100) + ",0)");

    

    parents.append("rect")
        .attr("width",200)
        .attr("height",1000)
        .style("opacity",0.5)
        .attr("rx",10)
        .attr("ry",10);

    mainNode.append("rect")
        .attr("width",200)
        .attr("height",1000)
        .attr("rx",10)
        .attr("ry",10);

    children.append("rect")
        .attr("width",200)
        .attr("height",1000)
        .style("opacity",0.5)
        .attr("rx",10)
        .attr("ry",10);

    

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

    var drawNode = function(node){
        var mainNode = svg.select("#mainNode");
        var theNode = mainNode.selectAll("g").data([node],function(d){
            return d.id;
        });

        var container = theNode.enter().append("g")
            .attr("transform","translate(25,0)");
        
        container.append("rect")
            .style("fill","red")
            .attr("width","150")
            .attr("height","100")
            .attr("rx",10)
            .attr("ry",10);

        theNode.append("text")
            .attr("transform","translate(25,50)")
            .text(function(d){
            return d.name;
            });

        theNode.append("text")
            .attr("transform","translate(25,75)")
            .text(function(d){
                return d.value;
            });
        
        theNode.exit().remove();
    };

    var drawMultipleNodes = function(baseContainer,childArray){
        console.log(childArray);
        var childNode = svg.select(baseContainer);
        var nodes = childNode.selectAll("g")
            .data(childArray,
                  function(d){
                      return d.id;
                  });

        var inodes = nodes.enter().append("g")
            .attr("transform",function(d,i){
                return "translate(0," + (i * 125) +")";
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
    
});
