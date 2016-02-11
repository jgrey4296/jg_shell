/**
   @file GeneralCommands
   @purpose Implements non-specific commands like loading and saving for the shell
*/

if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','d3','utils'],function(_,d3,util){
    "use strict";
    
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
        //selection ops:
        "select" : function(globalData,values){
            if(values.length === 0) values = [globalData.shell.cwd.id];
            values.forEach(function(d){
                var id = Number(d);
                if(Number.isNaN(id)) return;
                
                if(globalData.currentSelection.indexOf(id) === -1){
                    globalData.currentSelection.push(id);
                }
            });
        },
        "clearSelection" : function(globalData,values){
            globalData.currentSelection = [];
        },
        //eg: applyToSelection set tags wme 1
        //made for node::[new,rm,set,link,linkr],rule::[new,if,rm,set]
        //rete::assert
        "applyToSelection" : function(globalData,values){
            var command = globalData.lookupOrFallBack(values.shift(),globalData);
            globalData.currentSelection.forEach(function(d){
                command(globalData,values,d);                
            });
        },
        //inspect a selection
        "printSelection" : function(globalData,values){
            console.log("Current Selection:",globalData.currentSelection);

        },        
        //Search:
        "search" : function(globalData,values){
            globalData.lastSearch = "(?)."+values.join(".");
            globalData.lastSetOfSearchResults = globalData.shell.searchForFieldTagValue(values);
        },
        "refine" : function(globalData,values){
            globalData.lastSetOfSearchResults = globalData.shell.searchForFieldTagValue(values,globalData.lastSetOfSearchResults);
        },
        "inspect" : function(globalData,values){
            var nodeId = values.shift(),
                key = values.shift(),
                node = globalData.shell.allNodes[nodeId],                
                pairs;

            if(node === undefined) node = globalData.shell.cwd;
            if(key === "#all"){
                pairs = _.keys(node);
            }else{
                pairs = _.pairs(node[key]) || [];
            }
            globalData.lastInspection = "(" + node.id + ")." + key;
            globalData.lastInspectData = pairs;
            
        },
        "draw" : function(globalData,values){
            //Draw the Stash:
            drawStash(globalData,globalData.shell._nodeStash);
            //Draw search results:
            drawSearchResults(globalData,globalData.lastSetOfSearchResults);
            //draw inspect data
            drawInspectBar(globalData,globalData.lastInspectData);

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
        //Import a text form of json data:
        "import" : function(globalData,values){
            try{
                //var reconstructedJsonString = values.join(" ");
                var stringMinusCommand = globalData.rawCurrentLine.replace(/^import /,"");
                var reconJson = JSON.parse(stringMinusCommand);
                globalData.shell.importJson(reconJson);
            }catch(err){
                alert("Error Importing Json String:\n" + err.message);
                console.log("Error Importing Json Data: ",err);
            }            
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
            var text = globalData.shell.exportJson().replace(/’/g,"'").replace(/–/g,"-");
            window.exportedJson = text;

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
                "search" : ["$field $tag $value", "Search for nodes with a field, tag, value. Last param is a regex"],
                "refine" : ["$field $tag $value", "Searches through the currently displayed search results"],
                "inspect" : ["$key ($id)?", "Display the values of a key. Specify $id to inspect a remote node. Use #all to inspect all keys of a node"],
                "select" : ["$nodeId?", "add the cwd or a specific node to a temp selection"],
                "clearSelection" : ["","Clear the temp selection"],
                "applyToSelection" : [ "$command","Apply new,rm,set,link,linkr,if commands to every node in the selection"],
                "printSelection" : ["","Print the node ids in the selection to console"],
                "mode"  : ["$modeType", "Changes to the specified command mode. (node,rule,rete at the moment)"]               
            };
        },
        "printConditions" : function(globalData,values){
            var allConditions = _.values(globalData.shell.allNodes).filter(function(node){
                if(node.tags.type === "condition"){
                    return true;
                }else{
                    return false;
                }
            });
            console.log("Conditions:",allConditions);

            //for each condition, aggregate the fields of its tests
            var aggregateObjects = allConditions.map(function(condition){
                var tests = _.keys(condition.constantTests).map(function(testId){
                    return globalData.shell.allNodes[testId];
                });
                var aggregateFields = tests.reduce(function(m,test){
                    m[test.values.field] = 1;
                    return m;
                },{});
                return aggregateFields;
            });

            console.log("Prototypes:",aggregateObjects);
        },
        "modes" : function(globalData,values){
            console.log("Available Modes:",_.keys(globalData.commands));

        }
    };
    //--------------------
    //utility functions:
    var drawStash = function(globalData,values){
        var stashedList = values.map(function(d){
            return "(" + d.id + "): " + d.name.slice(0,10) + "...";
        }).reverse(); //reverse so last thing added is first thing drawn

        var stashContainer = d3.select("#stashContainer");
        if(stashContainer.empty()){
            stashContainer = d3.select("svg").append("g")
                .attr("id","stashContainer")
                .attr("transform",function(){
                    return "translate(" + (globalData.usableWidth * 0.5) + "," + (globalData.usableHeight * 0.8 ) + ")";
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
        //console.log("drawing search results:",searchData);
        //calculate sizes:
        var colWidth = globalData.calcWidth(globalData.usableWidth,7),
            availableHeight = globalData.usableHeight * 0.8,
            offset = availableHeight *  0.2,
            increment = (availableHeight - offset) / searchData.length;

        
        //take the search results,
        var searchResults = d3.select("#searchResults");
        if(searchResults.empty()){
            searchResults = d3.select("svg").append("g")
                .attr("id","searchResults")
                .attr("transform","translate(0," + (globalData.usableHeight * 0.1) + ")");

            searchResults.append("rect")
                .attr("width",100)
                .attr("height", availableHeight)
                .style("fill","red")
                .attr("rx",5).attr("ry",5);
        }

        //Draw
        if(searchData.length > 0){
            if(searchResults.selectAll(".searchText").empty()){
                searchResults.append("text").classed("searchText",true)
                    .attr("transform","translate(" + (colWidth * 0.1) + "," + (availableHeight * 0.1) + ")")
                    .text("Search Results:")
                    .style("fill","white")
                    .style("text-anchor","start");
                    //.attr("dy","1.4em");
                    
            }
            searchResults.select("rect").transition()
                .attr("width",colWidth);

            var headerSearchText = searchResults.select(".searchText")
                .text("Search results: " + globalData.lastSearch);

            util.wrapText(headerSearchText,(colWidth * 0.7),d3);
            
            var bound = searchResults.selectAll(".searchResult").data(searchData,function(d){ return d.id; });
            bound.exit().remove();

            var enter = bound.enter().append("g").classed("searchResult",true);

            enter.append("rect").classed("resultRect",true)
                .attr("width",(colWidth * 0.8))
                .style("fill","black");

            enter.append("text").classed("resultText",true)
                .style("fill","white");

                
            
            //update selection
            searchResults.selectAll(".searchResult").transition()
                .attr("transform",function(d,i){
                    return "translate(" + (colWidth * 0.1) + "," + (offset + (i * increment)) + ")";
                });

            searchResults.selectAll(".resultRect").transition()
                .attr("height",increment - 5)
                .attr("rx",10).attr("ry",10);

            var resultTexts = searchResults.selectAll(".resultText").transition()
                .text(function(d) { return d.id + ": " + d.name; })
                .attr("transform","translate(" + (colWidth * 0.05) + "," + (increment * 0.5) + ")");

            util.wrapText(resultTexts,(colWidth * 0.8),d3);
            
        }else{
            //shrink the window back
            searchResults.selectAll(".searchResult").remove();
            searchResults.selectAll(".searchText").remove();
            searchResults.select("rect").transition()
                .attr("width",10);
        }
    };


    //Draw inspect window
    var drawInspectBar = function(globalData,pairs){
        if(pairs === undefined){
            pairs = [];
        }
        var colWidth = globalData.calcWidth(globalData.usableWidth, 7),
            inspectResults = d3.select("#inspectResults"),
            availableHeight = globalData.usableHeight * 0.8,
            offset = availableHeight *  0.2,
            increment = (availableHeight - offset) / pairs.length;

        
        if(inspectResults.empty()){
            inspectResults = d3.select("svg").append("g")
                .attr("id","inspectResults")
                .attr("transform","translate(" + globalData.usableWidth + "," + (globalData.usableHeight * 0.1) + ")");
            inspectResults.append("rect")
                .attr("width",100)
                .attr("height",availableHeight)
                .style("fill","red")
                .attr("rx",5).attr("ry",5)
                .attr("transform","translate(-100,0)");
        }

        if(pairs.length > 0){
            //draw
            if(inspectResults.selectAll(".inspectText").empty()){
                inspectResults.append("text").classed("inspectText",true)
                    .attr("transform","translate(" + -(colWidth * 0.2) + "," + (availableHeight * 0.1) + ")")
                    .text("Inspect:")
                    .style("fill","white")
                    .style("text-anchor","end");
                    //.attr("dy","1.4em");
            }
            inspectResults.select("rect").transition()
                .attr("width",colWidth)
                .attr("transform","translate(" + -(colWidth) + ",0)");


            var inspectHeaderText = inspectResults.select(".inspectText")
                .text("Inspect: " + globalData.lastInspection);

            util.wrapText(inspectHeaderText,(colWidth * 0.8),d3);
            
            var bound = inspectResults.selectAll(".inspectResult").data(pairs,function(d){ return d[0]+d[1];});

            bound.exit().remove();

            var enter = bound.enter().append("g").classed("inspectResult",true);
            enter.append("rect").classed("inspectRect",true)
                .attr("width",(colWidth * 0.8))
                .style("fill","black");

            enter.append("text").classed("inspectResultText",true)
                .style("fill","white")
                .style("text-anchor","end");
                //.attr("dy","1.4em");


            
            //update:
            inspectResults.selectAll(".inspectResult").transition()
                .attr("transform",function(d,i){
                    return "translate(" + -(colWidth * 0.9) + "," + (offset + (i * increment)) + ")";
                });

            inspectResults.selectAll(".inspectRect").transition()
                .attr("height",increment - 5)
                .attr("rx",10).attr("ry",10);

            var inspectTexts = inspectResults.selectAll(".inspectResultText").transition()
                .text(function(d){
                    if(d instanceof Array){
                        return d[0] +": " + d[1];
                    }else{
                        return d;
                    }
                })
                .attr("transform","translate(" + (colWidth * 0.75) + "," + (increment * 0.5) + ")");

            util.wrapText(inspectTexts,(colWidth * 0.8),d3);
            
        }else{
            //cleanup if no data to draw
            inspectResults.selectAll(".inspectResult").remove();
            inspectResults.selectAll(".inspectText").remove();
            inspectResults.select("rect").transition()
                .attr("width",10)
                .attr("transform","translate(-10,0)");
        }        
    };    

    
    return GeneralCommands;
});
