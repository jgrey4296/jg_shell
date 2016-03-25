define(['underscore','d3','./DrawUtils'],function(_,d3,DrawUtils){
    "use strict";
    /**
       A Template drawing module
    */
    var TemplateDrawInterface = {};

    TemplateDrawInterface.drawFSM = function(globalData,fsm){
        console.log("Todo: drawFSM");
    };

    TemplateDrawInterface.drawEvent = function(globalData,event){
        console.log("Todo: drawEvent");
    };

    TemplateDrawInterface.drawState = function(globalData,state){
        console.log("Todo: DrawState");
    };
    
    // TemplateDrawInterface.drawSearchResults = function(globalData,data){
    //     //console.log("Search Results:",data);
    //     var commonData = {
    //         nodeDataSeparator : 5,
    //         groupDataSeparator : 2,
    //         widthAddition : 0,
    //         colHeight : globalData.usableHeight - 150,
    //         colWidth : globalData.calcWidth(globalData.usableWidth,5),
    //         halfWidth : globalData.halfWidth(),
    //         globalData : globalData,
    //         searchData : data,
    //         //translate each groupNode over
    //     };
    //     commonData.halfCol = commonData.colWidth * 0.5;
    //     commonData.groupNodeTransform = (d=>d[0][0].getBBox().width*0.5);

    //     //create the container, and the enclosing rectangle
    //     var searchResults = DrawUtils.createOrShare("searchResults",undefined,function(newG,name){
    //         newG.attr("transform","translate("+ 0 +"," + (globalData.usableHeight * 0.1) + ")");
    //         newG.append("rect").attr("id","EnclosingRect")
    //             .attr("width",10)
    //             .attr("height", globalData.usableHeight * 0.8)
    //             .style("fill",globalData.colours.greyTwo)
    //             .attr("rx",5).attr("ry",5);
    //     });

    //     //Draw the group of data, with a header title
    //     //GraphNode -> description...
    //     DrawUtils.drawGroup(searchResults,data,commonData,x=>[{name:x.toString()}])
    //         .then(function(){
    //             var rect = searchResults.select("#EnclosingRect");
    //             rect.attr("width",10);
    //             var bbox = searchResults[0][0].getBBox();
    //             rect.attr("width",bbox.width);

    //         });
    //     //shrink the window back if given an empty dataset
    //     // searchResults.selectAll(".searchResult").remove();
    //     // searchResults.selectAll(".searchText").remove();
    //     // searchResults.select("rect").transition()
    //     //     .attr("width",10);

    // };


    return TemplateDrawInterface;
});
