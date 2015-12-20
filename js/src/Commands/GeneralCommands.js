/**
   @file GeneralCommands
   @purpose Implements non-specific commands like loading and saving for the shell
*/

if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','d3'],function(_,d3){

    var GeneralCommands = {
        //Stashing:
        "stash" : function(globalData,values){
            globalData.shell.stash();
        },
        "unstash" : function(globalData,values){
            globalData.shell.unstash();
        },
        "top" : function(globalData,values){
            globalData.shell.top();
        },
        "prev" : function(globalData,values){
            globalData.shell.cd(globalData.shell.previousLocation);
        },
        //Mode changing:
        "mode" : function(globalData,values){
            //get the available modes
            var modes = _.keys(globalData.commands);
            var newMode;
            //if one of them is specified, use it,
            if(modes.indexOf(values[0]) > -1){
                 newMode = values[0];
            }else{
                //otherwise default to the first mode
                newMode = modes[0];
            }

            //cleanup the current mode
            globalData.commands[globalData.currentCommandMode].cleanup(globalData,[]);
            
            //Change to new mode
            globalData.currentCommandMode = newMode;
        },
        "draw" : function(globalData,values){
            //Draw the Stash:
            drawStash(globalData,globalData.shell._nodeStash);
            //Draw search results:
            drawSearchResults(globalData,globalData.lastSetOfSearchResults);
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
                        globalData.lookupOrFallBack("draw",globalData)(globalData,[]);
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
                "stash" : [ "", " Add the current node to the temp stack."],
                "unstash": ["", " Pop off and move to the head of the temp stack."],
                "top"   : [ "", " Move to the top of the temp stack."],
                "prev"  : [ "", " Move to the node previously you were at before the current node. "],
            };
        },        
    };
    //--------------------
    //utility functions:
    var drawStash = function(globalData,values){
        var stashedList = values.map(function(d){
            return "(" + d.id + "): " + d.name.slice(0,5);
        }).reverse(); //reverse so last thing added is first thing drawn

        var stashContainer = d3.select("#stashContainer");
        if(stashContainer.empty()){
            stashContainer = d3.select("svg").append("g")
                .attr("id","stashContainer")
                .attr("transform",function(){
                    return "translate(" + (globalData.usableWidth * 0.31) + "," + (globalData.usableHeight * 0.935 ) + ")";
                });
        }
        stashContainer.selectAll("text").remove();
        var boundTexts = stashContainer.selectAll("text").data(stashedList);
        boundTexts.enter().append("text")
            .attr("text-anchor","right")
            .style("fill",globalData.colours.textBlue)
            .attr("transform",function(d,i){
                return "translate(0," + (i * 15 ) + ")";
            })
            .text(function(d,i){
                return d;
            });
    };

    var drawSearchResults = function(globalData,searchData){
        //TODO

    };
    
    
    return GeneralCommands;
});
