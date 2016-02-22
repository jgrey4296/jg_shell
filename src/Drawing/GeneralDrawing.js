define(['underscore','d3','./DrawUtils'],function(_,d3,DrawUtils){

    var GeneralDrawInterface = {};

    GeneralDrawInterface.drawStash = function(globalData,data){
        //console.log("Drawing Stash:",data);
        //note the reversal
        var stashedList = data.map(d=>({name: d.toString()})).reverse(),
            commonData = {
                nodeDataSeparator : 10,
                groupDataSeparator : 10,
                widthAddition : 10,
                colHeight : globalData.usableHeight - 150,
                colWidth : globalData.calcWidth(globalData.usableWidth,5),
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

    GeneralDrawInterface.drawSearchResults = function(globalData,data){
        // //console.log("drawing search results:",searchData);
        // //calculate sizes:
        // var colWidth = globalData.calcWidth(globalData.usableWidth,7),
        //     availableHeight = globalData.usableHeight * 0.8,
        //     offset = availableHeight *  0.2,
        //     increment = (availableHeight - offset) / searchData.length;

        
        // //take the search results,
        // var searchResults = d3.select("#searchResults");
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

        // //Draw
        // if(searchData.length > 0){
        //     if(searchResults.selectAll(".searchText").empty()){
        //         searchResults.append("text").classed("searchText",true)
        //             .attr("transform","translate(" + (colWidth * 0.1) + "," + (availableHeight * 0.1) + ")")
        //             .text("Search Results:")
        //             .style("fill","white")
        //             .style("text-anchor","start");
        //         //.attr("dy","1.4em");
                
        //     }
        //     searchResults.select("rect").transition()
        //         .attr("width",colWidth);

        //     var headerSearchText = searchResults.select(".searchText")
        //         .text("Search results: " + globalData.lastSearch);

        //     util.wrapText(headerSearchText,(colWidth * 0.7),d3);
            
        //     var bound = searchResults.selectAll(".searchResult").data(searchData,function(d){ return d.id; });
        //     bound.exit().remove();

        //     var enter = bound.enter().append("g").classed("searchResult",true);

        //     enter.append("rect").classed("resultRect",true)
        //         .attr("width",(colWidth * 0.8))
        //         .style("fill","black");

        //     enter.append("text").classed("resultText",true)
        //         .style("fill","white");

            
            
        //     //update selection
        //     searchResults.selectAll(".searchResult").transition()
        //         .attr("transform",function(d,i){
        //             return "translate(" + (colWidth * 0.1) + "," + (offset + (i * increment)) + ")";
        //         });

        //     searchResults.selectAll(".resultRect").transition()
        //         .attr("height",increment - 5)
        //         .attr("rx",10).attr("ry",10);

        //     var resultTexts = searchResults.selectAll(".resultText").transition()
        //         .text(function(d) { return d.id + ": " + d.name; })
        //         .attr("transform","translate(" + (colWidth * 0.05) + "," + (increment * 0.5) + ")");

        //     util.wrapText(resultTexts,(colWidth * 0.8),d3);
            
        // }else{
        //     //shrink the window back
        //     searchResults.selectAll(".searchResult").remove();
        //     searchResults.selectAll(".searchText").remove();
        //     searchResults.select("rect").transition()
        //         .attr("width",10);
        // }
    };

    GeneralDrawInterface.drawInspectResults = function(globalData,data){
        // if(pairs === undefined){
        //     pairs = [];
        // }
        // var colWidth = globalData.calcWidth(globalData.usableWidth, 7),
        //     inspectResults = d3.select("#inspectResults"),
        //     availableHeight = globalData.usableHeight * 0.8,
        //     offset = availableHeight *  0.2,
        //     increment = (availableHeight - offset) / pairs.length;

        
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

        // if(pairs.length > 0){
        //     //draw
        //     if(inspectResults.selectAll(".inspectText").empty()){
        //         inspectResults.append("text").classed("inspectText",true)
        //             .attr("transform","translate(" + -(colWidth * 0.2) + "," + (availableHeight * 0.1) + ")")
        //             .text("Inspect:")
        //             .style("fill","white")
        //             .style("text-anchor","end");
        //         //.attr("dy","1.4em");
        //     }
        //     inspectResults.select("rect").transition()
        //         .attr("width",colWidth)
        //         .attr("transform","translate(" + -(colWidth) + ",0)");


        //     var inspectHeaderText = inspectResults.select(".inspectText")
        //         .text("Inspect: " + globalData.lastInspection);

        //     util.wrapText(inspectHeaderText,(colWidth * 0.8),d3);
            
        //     var bound = inspectResults.selectAll(".inspectResult").data(pairs,function(d){ return d[0]+d[1];});

        //     bound.exit().remove();

        //     var enter = bound.enter().append("g").classed("inspectResult",true);
        //     enter.append("rect").classed("inspectRect",true)
        //         .attr("width",(colWidth * 0.8))
        //         .style("fill","black");

        //     enter.append("text").classed("inspectResultText",true)
        //         .style("fill","white")
        //         .style("text-anchor","end");
        //     //.attr("dy","1.4em");


            
        //     //update:
        //     inspectResults.selectAll(".inspectResult").transition()
        //         .attr("transform",function(d,i){
        //             return "translate(" + -(colWidth * 0.9) + "," + (offset + (i * increment)) + ")";
        //         });

        //     inspectResults.selectAll(".inspectRect").transition()
        //         .attr("height",increment - 5)
        //         .attr("rx",10).attr("ry",10);

        //     var inspectTexts = inspectResults.selectAll(".inspectResultText").transition()
        //         .text(function(d){
        //             if(d instanceof Array){
        //                 return d[0] +": " + d[1];
        //             }else{
        //                 return d;
        //             }
        //         })
        //         .attr("transform","translate(" + (colWidth * 0.75) + "," + (increment * 0.5) + ")");

        //     util.wrapText(inspectTexts,(colWidth * 0.8),d3);
            
        // }else{
        //     //cleanup if no data to draw
        //     inspectResults.selectAll(".inspectResult").remove();
        //     inspectResults.selectAll(".inspectText").remove();
        //     inspectResults.select("rect").transition()
        //         .attr("width",10)
        //         .attr("transform","translate(-10,0)");
        // }        

    };
    
    GeneralDrawInterface.drawSelection = function(globalData,data){



    };    

    return GeneralDrawInterface;
});
