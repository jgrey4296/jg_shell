/**
   @file GeneralCommands
   @purpose Implements non-specific commands like loading and saving for the shell
*/

if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore'],function(_){

    var GeneralCommands = {
        "mode" : function(sh,values,globalData){
            //get the available modes
            //if one of them is specified, use it,
            //else default to node mode
        },
        "context": function(sh,values){
            //draw main columns and nodes
            draw(sh.cwd);
            //draw additional elements:
            drawActivatedRules(sh.reteNet.lastActivatedRules);
            drawStash(sh._nodeStash);
            drawSearchColumn(sh.lastSearchResults);
        },
        //Load a file from the server
        "load" : function(sh,values){
            var request = new XMLHttpRequest();
            request.onreadystatechange=function(){
                if(request.readyState===4){
                    try{
                        var receivedJson = JSON.parse(request.responseText);
                        console.log("Received JSON:",receivedJson);
                        sh.importJson(receivedJson);
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
        "save" : function(sh,values){
            console.log("Saving:",values);
            var request = new XMLHttpRequest();
            request.onreadystatechange=function(){
                if (request.readyState===4){
                    console.log("Finished");
                    console.log(request.responseText);
                }
            };
            request.open("POST","saveData="+values[0],true);
            request.send(sh.exportJson());
        },
        "json" : function(sh,values){
            var text = sh.exportJson();
            //From: http://stackoverflow.com/questions/10472927/add-content-to-a-new-open-window
            var myWindow = window.open('data:application/json;' + (window.btoa?'base64,'+btoa(text):text));
        },
        "files" : function(sh,values){
            window.open("./data/","_blank");
        },

        "help" : function(sh,values){
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
