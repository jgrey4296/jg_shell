/**
   @file MainCommandCLI
   @purpose takes text, executes relevant commands on the shell
*/


define(['underscore'],function(_){

    var MainCommandCLI = function(currentLine,globalData){
        var splitLine = currentLine.trim().split(" ");
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
