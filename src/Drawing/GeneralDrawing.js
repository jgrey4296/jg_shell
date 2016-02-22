define(['underscore','d3','./DrawUtils'],function(_,d3,DrawUtils){

    var GeneralDrawInterface = {};

    /**
     @function drawStash
     @purpose Draws a simple stack of small node descriptions, in the bottom middle of the screen
     */
    GeneralDrawInterface.drawStash = function(globalData,data){
        //console.log("Drawing Stash:",data);
        //note the reversal
        var stashedList = data.map(d=>({name: d.toString()})).reverse(),
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
                return "translate(" + (commonData.halfWidth) + "," + (globalData.usableHeight * 0.6 ) + ")";
            });
        });

        DrawUtils.drawGroup(stashContainer,stashedList,commonData,d=>[d]);
    };

    /**
     @function drawSearchResults
     @purpose Draws a list of node information in a left hand bar
     */
    GeneralDrawInterface.drawSearchResults = function(globalData,data){
        var commonData = {
                nodeDataSeparator : 10,
                groupDataSeparator : 10,
                widthAddition : 10,
                colHeight : globalData.usableHeight - 150,
                colWidth : globalData.calcWidth(globalData.usableWidth,5),
                halfWidth : globalData.halfWidth(),
                globalData : globalData,
                searchData : data
            };
        commonData.halfCol = commonData.colWidth * 0.5;


        //create the container, and the enclosing rectangle
        var searchResults = d3.select("#searchResults");

        // if(searchResults.empty()){
        //     searchResults = d3.select("svg").append("g")
        //         .attr("id","searchResults")
        //         .attr("transform","translate(0," + (globalData.usableHeight * 0.1) + ")");
        //     searchResults.append("rect")
        //         .attr("width",100)
        //         .attr("height", availableHeight)
        //         .style("fill","red")
        //         .attr("rx",5).attr("ry",5);
        // }


        //Draw the group of data, with a header title
        //DrawUtils.drawGroup....

        //shrink the window back if given an empty dataset
        // searchResults.selectAll(".searchResult").remove();
        // searchResults.selectAll(".searchText").remove();
        // searchResults.select("rect").transition()
        //     .attr("width",10);

    };

    /**
     @function drawInspectResults
     @purpose Draws the sidbar of data from a particular node
     */
    GeneralDrawInterface.drawInspectResults = function(globalData,data){
        var commonData = {
                nodeDataSeparator : 10,
                groupDataSeparator : 10,
                widthAddition : 10,
                colHeight : globalData.usableHeight - 150,
                colWidth : globalData.calcWidth(globalData.usableWidth,5),
                halfWidth : globalData.halfWidth(),
                globalData : globalData,
                searchData : data
            };
        commonData.halfCol = commonData.colWidth * 0.5;


        //Create the container
        var inspectResults = d3.select("#inspectResults");
        
        // if(inspectResults.empty()){
        //     inspectResults = d3.select("svg").append("g")
        //         .attr("id","inspectResults")
        //         .attr("transform","translate(" + globalData.usableWidth + "," + (globalData.usableHeight * 0.1) + ")");
        //     inspectResults.append("rect")
        //         .attr("width",100)
        //         .attr("height",availableHeight)
        //         .style("fill","red")
        //         .attr("rx",5).attr("ry",5)
        //         .attr("transform","translate(-100,0)");
        // }

        //Draw the group
        //DrawUtils.drawGroup....
        

        //shrink the  window if given an empty dataset
        //inspectResults.selectAll(".inspectResult").remove();
        //inspectResults.selectAll(".inspectText").remove();
        //inspectResults.select("rect").transition()
        //.attr("width",10)
        //.attr("transform","translate(-10,0)");

    };
    
    GeneralDrawInterface.drawSelection = function(globalData,data){



    };    

    return GeneralDrawInterface;
});
