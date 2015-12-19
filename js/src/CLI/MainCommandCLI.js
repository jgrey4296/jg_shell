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
            }
        }else{
            console.warn("No function specified to execute: " + currentLine);
        }
        
        //call draw command
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
    };
    
    return MainCommandCLI;
});
