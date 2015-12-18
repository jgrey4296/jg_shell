/**
   @file HelpCLI
   @purpose To parse help commands, and display the result
 */

define(['underscore','d3'],function(_,d3){

    //Main function called
    var HelpCLI = function(currentLine,globalData){
        var textArray = theValue.split(" ");
        var lastArr = textArray.pop().split("#");
        if(lastArr[0] === "help"){
            console.log("Help!");
            //Get the help text object:
            var helpObject = {};
            //if the user specifies a mode
            if(last.length > 1 && globalData.commands[lastArr[1]]){
                helpObject = globalData.commands[lastArr[1]].help;
            //otherwise use current command mode:
            }else if(globalData.commands[globalData.currentCommandMode].help !== undefined){
                helpObject = globalData.commands[globalData.currentCommandMode].help;
            }
            drawHelp(helpObject,globalData);
        }else{
            d3.select("#helpWindow").remove();
        }
    };

    //----------------------------------------
    //Helper functions:
    
    var drawHelp = function(helpObject,globalData){
        //Create the text to be displayed
        var startText = "Current Mode: " + globalData.currentCommandMode;
        var helpText = [startText,"Available Commands: ",""].concat(_.keys(helpObject).map(function(d){
            return d + " " + helpObject[d].join(" ---> ");
        }));

        //Get the container:
        var helpWindow = d3.select("#helpWindow");
        if(helpWindow.empty()){
            //Initialise the help container
            helpWindow = d3.select("svg").append("g")
                .attr("transform",
                      "translate(" + (globalData.usableWidth * 0.25) + "," + (globalData.usableHeight * 0.25) + ")")
                .attr("id","helpWindow");
            
            helpWindow.append("rect")
                .style("fill",globalData.colours.darkBlue)
                .attr("width",globalData.usableWidth * 0.5)
                .attr("height",global.helpSize)
                .attr("rx",10)
                .attr("ry",10);
        }

        var boundSelection = helpWindow.selectAll("text").data(helpText);

        boundSelection.enter()
            .append("text")
            .style("text-anchor","left")
            .style("fill",globalData.colours.textBlue);
        
        boundSelection.attr("transform",function(d,i){
            return "translate("+ (globalData.usableWidth * 0.02)
                + "," + (30 + i * 20) +")";
        })
            .text(function(d){
                return d;
            });

        boundSelection.exit().remove();
    };


    //Return just the main function
    return HelpCLI;
});
