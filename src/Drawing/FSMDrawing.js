/* jshint esversion : 6 */
define(['underscore','d3','./DrawUtils'],function(_,d3,DrawUtils){
    "use strict";
    /**
       A Template drawing module
    */
    var FSMDrawInterface = {};

    FSMDrawInterface.drawFSM = function(globalData,fsmNode){
        let fsmData = fsmNode.getDescriptionObjects(),
            stateData = [],
            eventData = [],
            commonData = new DrawUtils.CommonData(globalData,fsmData,3);
        commonData.nodeDataSeparator = 10;
        commonData.groupDataSeparator = 10;
        commonData.widthAddition = 10;
        delete commonData.groupNodeTransform;
        
        //DOM elements:
        let mainContainer = DrawUtils.createOrShare('mainContainer'),
            fsmContainer = DrawUtils.createOrShare('fsmContainer',mainContainer)
            .attr('transform',`translate(${commonData.halfWidth},100)`),
            //
            stateContainer = DrawUtils.createOrShare('states',mainContainer)
            .attr('transform',`translate(${commonData.leftOffset},100)`),
            //
            eventContainer = DrawUtils.createOrShare('events',mainContainer)
            .attr('transform',`translate(${commonData.rightOffset},100)`);
        
        //draw the main fsm node
        DrawUtils.drawSingleNode(fsmContainer,fsmData,commonData);
            
        
        //draw the states
        stateData.unshift([{name: "States:"}]);
        commonData.data = stateData;
        DrawUtils.drawGroup(stateContainer,commonData);
        
        //draw the events
        eventData.unshift([{name:"Events:"}]);
        commonData.data = eventData;
        DrawUtils.drawGroup(eventContainer,commonData);
        
    };

    FSMDrawInterface.drawEvent = function(globalData,event){
        console.log("Todo: drawEvent");
        //Draw the event
        
        //Draw the source states

        //draw the result states
        
    };

    FSMDrawInterface.drawState = function(globalData,state){
        console.log("Todo: DrawState");

        //draw the source states
        
        //draw source events

        //draw the state
        
        //draw the outgoing events

        //draw the resulting states
        
    };

    FSMDrawInterface.cleanup = DrawUtils.cleanup.bind({},"#fsmContainer","#events","#states");
    
    // FSMDrawInterface.drawSearchResults = function(globalData,data){
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


    return FSMDrawInterface;
});
