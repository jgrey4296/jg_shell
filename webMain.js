
require(['libs/d3.min','src/shell'],function(d3,Shell){
    //The simulated shell:
    var theShell = new Shell();

    //Maps typed commands to methods on shell
    var commands = {
        "mkdir" : function(sh,values){
            sh.mkdir(values[0],values.slice(1));
        },
        "cd" : function(sh,values){
            sh.changeDir(values[0]);
        },
        "pwd" : function(sh,values){
            console.log(sh.pwd());
        },
        "rm" : function(sh,values){
            console.log("TODO: rm");
        },
        "ls" : function(sh,values){
            console.log(sh.ls(values));
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

            if (line !== null){
                var splitLine = line.trim().split(" ");
                var command = commands[splitLine[0]];
                if (command !== undefined){
                    command(theShell,splitLine.slice(1));
                }else{
                    console.log("unrecognised command: " + splitLine[0]);
                }
            }
        }
    });

    //Setup the svg for drawing
    var svg = d3.select('body').append('svg')
        .attr('width',window.innerWidth - 10)
        .attr('height',window.innerHeight - 30);

    svg.append('circle')
        .attr('r',50)
        .attr('cx',HalfWidth())
        .attr('cy',HalfHeight() - 100);

    for(var i = 0; i < 10; i++){
        svg.append('circle')
            .attr('r',Math.random() * 80 + 10)
            .attr('cx',Math.random() * 500 + 200)
            .attr('cy',Math.random() * 500 + 200);
    };
    
    console.log(HalfHeight());



              
    
});
