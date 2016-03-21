define(['underscore','d3','./DrawUtils'],function(_,d3,DrawUtils){
    "use strict";
    /**
     The General Drawing interface
     @exports Drawing/GeneralDrawing
     */
    var GeneralDrawInterface = {};

    /**
     Draws a simple stack of small node descriptions, in the bottom middle of the screen
     @function 
     @param globalData
     @param data
     */
    GeneralDrawInterface.drawStash = function(globalData,data){
        //console.log("Drawing Stash:",data);
        //note the reversal
        var stashedList = data.map(d=>(d.toString())).reverse(),
            commonData = {
                nodeDataSeparator : 10,
                groupDataSeparator : 10,
                widthAddition : 10,
                colHeight : globalData.usableHeight - 150,
                colWidth : globalData.calcWidth(globalData.usableWidth,3),
                halfWidth : globalData.halfWidth(),
                globalData : globalData,
                stashData : stashedList
            };
        commonData.halfCol = commonData.colWidth * 0.5;

        //Create the stash container
        var stashContainer = DrawUtils.createOrShare("stashContainer",undefined,function(selection,name){
            //setup the container here
            selection.attr("transform",function(){
                return "translate(" + (commonData.halfWidth) + "," + (globalData.usableHeight * 0.8 ) + ")";
            });
        });
        DrawUtils.drawGroup(stashContainer,stashedList,commonData);
    };

    /**
     Draws a list of node information in a left hand bar
     @function
     @param globalData
     @param data
     */
    GeneralDrawInterface.drawSearchResults = function(globalData,data){
        //console.log("Search Results:",data);
        var commonData = {
            nodeDataSeparator : 5,
            groupDataSeparator : 2,
            widthAddition : 0,
            colHeight : globalData.usableHeight - 150,
            colWidth : globalData.calcWidth(globalData.usableWidth,5),
            halfWidth : globalData.halfWidth(),
            globalData : globalData,
            searchData : data,
            //translate each groupNode over
        };
        commonData.halfCol = commonData.colWidth * 0.5;
        commonData.groupNodeTransform = (d=>d[0][0].getBBox().width*0.5);

        //create the container, and the enclosing rectangle
        var searchResults = DrawUtils.createOrShare("searchResults",undefined,function(newG,name){
            newG.attr("transform","translate("+ 0 +"," + (globalData.usableHeight * 0.1) + ")");
            newG.append("rect").attr("id","EnclosingRect")
                .attr("width",10)
                .attr("height", globalData.usableHeight * 0.8)
                .style("fill",globalData.colours.greyTwo)
                .attr("rx",5).attr("ry",5);
        });

        //Draw the group of data, with a header title
        //GraphNode -> description...
        DrawUtils.drawGroup(searchResults,data,commonData,x=>[{name:x.toString()}])
            .then(function(){
                var rect = searchResults.select("#EnclosingRect");
                rect.attr("width",10);
                var bbox = searchResults[0][0].getBBox();
                rect.attr("width",bbox.width);

            });
        //shrink the window back if given an empty dataset
        // searchResults.selectAll(".searchResult").remove();
        // searchResults.selectAll(".searchText").remove();
        // searchResults.select("rect").transition()
        //     .attr("width",10);

    };

    /**
       Draws the sidbar of data from a particular node
       @function 
       @param globalData
       @param data
     */
    GeneralDrawInterface.drawInspectResults = function(globalData,data){
        //console.log("Inspecting:",data);
        var commonData = {
            nodeDataSeparator : 10,
            groupDataSeparator : 10,
            widthAddition : 10,
            colHeight : globalData.usableHeight - 150,
            colWidth : globalData.calcWidth(globalData.usableWidth,5),
            halfWidth : globalData.halfWidth(),
            globalData : globalData,
            searchData : data.map(d=>d instanceof Array ? d.join(": ") : d)
        };
        commonData.halfCol = commonData.colWidth * 0.5;
        commonData.groupNodeTransform = (d=>d[0][0].getBBox().width*-0.5);
        
        //Create the container
        var inspectResults = DrawUtils.createOrShare("inspectResults",undefined,function(newG,name){
            newG.attr("transform","translate(" + globalData.usableWidth + "," + (globalData.usableHeight * 0.1) + ")");
            newG.append("rect")
                .attr("width",10)
                .attr("height",globalData.usableHeight*0.8)
                .style("fill",globalData.colours.greyTwo)
                .attr("rx",5).attr("ry",5)
                .attr("transform","translate(-10,0)");
        });

        //Draw the group
        //value -> [{name:value}]
        DrawUtils.drawGroup(inspectResults,commonData.searchData,commonData)
            .then(function(){
                var rect = inspectResults.select("rect");
                rect.attr("width",10).attr("transform","translate(-10,0)");
                var bbox = inspectResults[0][0].getBBox();
                rect.attr("transform",`translate(${-bbox.width},0)`)
                    .attr("width",bbox.width);
                
            });
        

        //shrink the  window if given an empty dataset
        //inspectResults.selectAll(".inspectResult").remove();
        //inspectResults.selectAll(".inspectText").remove();
        //inspectResults.select("rect").transition()
        //.attr("width",10)
        //.attr("transform","translate(-10,0)");

    };

    /**
       unimplemented
       @function
     */
    GeneralDrawInterface.drawSelection = function(globalData,data){



    };    

    return GeneralDrawInterface;
});
