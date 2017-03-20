/**
   The CLI module that deals with help requests
   @module CLI/HelpCLI
*/
import _ from 'lodash';
/**
   @function HelpCLI
   @param currentLine
   @param globalData
*/
let d3 = {};
let HelpCLI = function(currentLine,globalData){
    let textArray = currentLine.split(" "),
        //Get the last thing typed, and split it
        commandNameArray = textArray.pop().split("#");
    if (commandNameArray[0] === "help"){
        //console.log("Help!");
        //Get the help text object:
        let helpObject = null;
        //if the user specifies a mode
        if (commandNameArray.length > 1 && globalData.commands[commandNameArray[1]]){
            helpObject = globalData.commands[commandNameArray[1]].help();
            //otherwise use current command mode:
        } else if (globalData.commands[globalData.currentCommandMode[0]].help !== undefined){
            helpObject = globalData.commands[globalData.currentCommandMode[0]].help();
        }
        //Draw
        if (helpObject){
            drawHelp(helpObject,globalData);
        }
    }
};

//----------------------------------------
//Helper functions:

/**
   @function drawHelp
   @param helpObject
   @param globalData
*/
let drawHelp = function(helpObject,globalData){
    //Create the text to be displayed
    let startText = "Current Mode: " + globalData.currentCommandMode[0],
        availableModes = "Available Modes: " + _.keys(globalData.commands).join(" "),
        helpValues = alignArrows(_.keys(helpObject).map(d=>`${d} ${helpObject[d].join(" ---> ")}`)),
        helpText = [startText,availableModes,"","Available Commands: ",""].concat(helpValues);

    //Get the container:
    let helpWindow = d3.select("#helpWindow");
    if (helpWindow.empty()){
        //Initialise the help container
        helpWindow = d3.select("svg").append("g")
            .attr("transform",
                  "translate(" + (globalData.usableWidth * 0.10) + "," + (globalData.usableHeight * 0.1) + ")")
            .attr("id","helpWindow");
        
        helpWindow.append("rect")
            .style("fill",globalData.colours.greyTwo)
            .attr("width",globalData.usableWidth * 0.8)
            .attr("height",globalData.helpSize)
            .attr("rx",10)
            .attr("ry",10);
    }

    let boundSelection = helpWindow.selectAll("text").data(helpText);

    boundSelection.enter()
        .append("text")
        .style("text-anchor","start")
        .style("fill",globalData.colours.textBlue);
    
    boundSelection.attr("transform",(d,i) => {
        return "translate("+ (globalData.usableWidth * 0.02) + "," + (30 + i * 20) +")";
    })
        .text((d) => {
            return d;
        })
        .style("white-space","pre");

    boundSelection.exit().remove();
};


let alignArrows = function(textArray){
    let furthestArrow = textArray.reduce((m,v) => {
        let currOffset = v.search(/ ---> /);
        if (currOffset > m){
            return currOffset;
        }
        return m;
    },0),
        offsetTexts = textArray.map((d) => {
            let amtToOffset = furthestArrow - d.search(/ ---> /);
            return d.replace(/ ---> /,(Array(amtToOffset + 2).join(" ") + " ---> "));
        });
    return offsetTexts;
};


//Return just the main function
export {  HelpCLI };

