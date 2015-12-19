/**
   @file MainCommandCLI
   @purpose takes text, executes relevant commands on the shell
*/


define(['underscore'],function(_){

    var MainCommandCLI = function(currentLine,globalData){
        var splitLine = currentLine.trim().split(" ");
        var commandName = splitLine.shift();
        //lookup command
        var commandToExecute = lookupOrFallBack(commandName,globalData);
        //perform command
        if(commandToExecute && typeof commandToExecute === 'function'){
            commandToExecute(globalData,splitLine);
        }else{
            console.warn("No function specified to execute: " + currentLine);
        }
        
        //call draw command
        var drawCommand = lookupOrFallBack("draw",globalData);
        if(drawCommand && typeof drawCommand === 'function'){
            globalData.commands[globalData.currentCommandMode].draw(globalData);
        }else{
            throw new Error("No Draw Command Found");
        }
    };

    var lookupOrFallBack = function(commandName,globalData){
        var commandToExecute;
        if(globalData.commands[globalData.currentCommandMode]
           && globalData.commands[globalData.currentCommandMode][commandName]){
            commandToExecute = globalData.commands[globalData.currentCommandMode][commandName];
        }else{        
            //command not found, fallback
            var fallBacks = _.clone(globalData.commandFallBackOrder);
            while(fallBacks.length > 0){
                var currentFallback = fallBacks.shift();
                if(globalData.commands[currentFallback][commandName] !== undefined){
                    commandToExecute = globalData.commands[currentFallback][commandName];
                }
            }
        }
        return commandToExecute;
    };

    
    return MainCommandCLI;
});
