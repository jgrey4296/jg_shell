/**
   Takes text, executes relevant commands on the shell
   @module CLI/MainCommandCLI
*/
import _ from 'lodash';

/**
   Takes a line, and extracts the command
   @function parseCurrentLine
   @param currentLine
   @returns {Array.<String>}
*/
let parseCurrentLine = function(currentLine){
    let splitLine = currentLine.split(/ /);

    let inString = false;
    //Reconstruct strings from inputs
    let combined = splitLine.reduce(function(m,v){
        if (!inString){
            m.push(v.replace(/"/,""));
        } else {
            m[m.length-1] += " " + v.replace(/"/,"");
        }
        if (v[0] === '"') { inString = true; }
        if (v[v.length-1] === '"') { inString = false; }
        return m;
    },[]);
    return combined;
};

/**
   The CLI Function, takes a line and finds the command to apply
   @param currentLine
   @param globalData
   @param skipDraw
   @function MainCommandCLI
*/
let MainCommandCLI = function(currentLine,globalData,skipDraw){
    if (skipDraw === undefined) { skipDraw = false; }
    globalData.rawCurrentLine = currentLine;
    let splitLine = parseCurrentLine(currentLine),
        commandName = splitLine.shift(),
        //lookup command
        commandToExecute = globalData.lookupOrFallBack(commandName,globalData);
    
    //perform command
    if (commandToExecute && typeof commandToExecute === 'function'){
        try{
            commandToExecute(globalData,splitLine);
        }catch(e){
            console.error("Command Error:",e);
            alert(e);
        }
    } else {
        //console.warn("No function specified to execute: " + currentLine);
    }

    //Finish if not drawing
    if (skipDraw) { return; }
    //Else draw:
    //if current command mode is different from previous command mode, cleanup previous:
    let currCommandMode = globalData.currentCommandMode[0],
        prevCommandMode = globalData.currentCommandMode[1];
    if (prevCommandMode !== undefined && currCommandMode !== prevCommandMode){
        let prevCleanup = globalData.lookupOrFallBack('cleanup',globalData,prevCommandMode);
        prevCleanup(globalData);
    }
    
    //call the mode specific draw command
    let drawCommand = globalData.lookupOrFallBack("draw",globalData);
    if (drawCommand && typeof drawCommand === 'function'){
        try{
            drawCommand(globalData);
        }catch(e){
            console.error("Draw Error:",e);
        }
    } else {
        throw new Error("No Draw Command Found");
    }

    //Draw the general draw command:
    if (globalData.commands.general.draw && typeof globalData.commands.general.draw === 'function'){
        globalData.commands.general.draw(globalData);
    }

    //keep the size of the currentCommandMode queue to a reasonable size:
    globalData.currentCommandMode = globalData.currentCommandMode.slice(0,3);
    
};

export { MainCommandCLI };

