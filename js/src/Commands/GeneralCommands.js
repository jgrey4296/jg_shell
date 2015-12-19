/**
   @file GeneralCommands
   @purpose Implements non-specific commands like loading and saving for the shell
*/

if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore'],function(_){

    var GeneralCommands = {
        "mode" : function(globalData,values){
            //get the available modes
            var modes = _.keys(globalData.commands);
            //if one of them is specified, use it,
            if(modes.indexOf(values[0]) > -1){
                globalData.currentCommandMode = values[0];
            }else{
                globalData.currentCommandMode = modes[0];
            }
        },
        "context": function(globalData,values){
            //draw main columns and nodes
            draw(globalData.shell.cwd);
            //draw additional elements:
            drawActivatedRules(globalData.shell.reteNet.lastActivatedRules);
            drawStash(globalData.shell._nodeStash);
            drawSearchColumn(globalData.shell.lastSearchResults);
        },
        //Load a file from the server
        "load" : function(globalData,values){
            var request = new XMLHttpRequest();
            request.onreadystatechange=function(){
                if(request.readyState===4){
                    try{
                        var receivedJson = JSON.parse(request.responseText);
                        console.log("Received JSON:",receivedJson);
                        globalData.shell.importJson(receivedJson);
                        commands.context(theShell);
                    }catch(err){
                        alert("Error loading data: \n" + err.message);
                        console.log("Error loading data:",err);
                    }
                }
            };
            request.open("GET","/data/"+values[0]+".json",true);
            request.send();
        },
        //Save the current graph to the server
        "save" : function(globalData,values){
            console.log("Saving:",values);
            var request = new XMLHttpRequest();
            request.onreadystatechange=function(){
                if (request.readyState===4){
                    console.log("Finished");
                    console.log(request.responseText);
                }
            };
            request.open("POST","saveData="+values[0],true);
            request.send(globalData.shell.exportJson());
        },
        "json" : function(globalData,values){
            var text = globalData.shell.exportJson();
            //From: http://stackoverflow.com/questions/10472927/add-content-to-a-new-open-window
            var myWindow = window.open('data:application/json;' + (window.btoa?'base64,'+btoa(text):text));
        },
        "files" : function(globalData,values){
            window.open("./data/","_blank");
        },

        "help" : function(globalData,values){
            return {
                "load"  : [ "$fileName", " Load a specified file in to populate the shell"],
                "save"  : [ "$fileName", " Save to a specified file. With paired server ONLY"],
                "json"  : [ "", " Open a tab with the shell as json"],
                "files" : [ "", " Display a list of available files to load"],
            };
        },        
    };

    return GeneralCommands;
});
