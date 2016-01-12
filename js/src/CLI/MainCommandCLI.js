/**
   @file MainCommandCLI
   @purpose takes text, executes relevant commands on the shell
*/


define(['underscore'],function(_){
    "use strict";
    
    var parseCurrentLine = function(currentLine){
        var splitLine = currentLine.split(/ /);

        var inString = false;
        //Reconstruct strings from inputs
        var combined = splitLine.reduce(function(m,v){
            if(!inString){
                m.push(v.replace(/"/,""));
            }else{
                m[m.length-1] += " " + v.replace(/"/,"");
            }
            if(v[0] === '"') inString = true;
            if(v[v.length-1] === '"') inString = false;
            return m;
        },[]);
        return combined;
    };

        
    //The CLI Function, takes a line and finds the command to apply
    var MainCommandCLI = function(currentLine,globalData,skipDraw){
        if(skipDraw === undefined) skipDraw = false;
        var splitLine = parseCurrentLine(currentLine);
        
        var commandName = splitLine.shift();
        //lookup command
        var commandToExecute = globalData.lookupOrFallBack(commandName,globalData);
        
        //perform command
        if(commandToExecute && typeof commandToExecute === 'function'){
            try{
                commandToExecute(globalData,splitLine);
            }catch(e){
                console.error("Command Error:",e);
                alert(e);
            }
        }else{
            console.warn("No function specified to execute: " + currentLine);
        }

        //Finish if not drawing
        if(skipDraw) return;
        //Else draw:
        //call the mode specific draw command
        var drawCommand = globalData.lookupOrFallBack("draw",globalData);
        if(drawCommand && typeof drawCommand === 'function'){
            try{
                drawCommand(globalData);
            }catch(e){
                console.error("Draw Error:",e);
            }
        }else{
            throw new Error("No Draw Command Found");
        }

        //Draw the general draw command:
        if(globalData.commands.general.draw && typeof globalData.commands.general.draw === 'function'){
            globalData.commands.general.draw(globalData);
        }        
    };
    
    return MainCommandCLI;
});
