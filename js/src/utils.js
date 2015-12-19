/**
   @file utils
   @purpose defines general utilities to use across projects
 */
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','d3'],function(_,d3){

    var util = {};
    
    util.randomChoice = function(array){
        var randIndex = Math.floor(Math.random() * array.length);
        return array[randIndex];
    };

    
    util.textAlignPairs = function(arrayOfPairs){
        console.log("Aligning:",arrayOfPairs);
        //Get the largest strings on each side
        var maxStringLengthLHS = Math.max.apply(null,arrayOfPairs.map(function(d){
            return d[0].length;
        }));
        
        var maxStringLengthRHS = Math.max.apply(null,arrayOfPairs.map(function(d){
            return d[1].length;
        }));

        var totalStringLength = Math.max(maxStringLengthLHS,maxStringLengthRHS);
        
        //Align each side
        var alignedPairs = arrayOfPairs.map(function(d){
            var lhsDifference = d[1].length - d[0].length
                rhsDifference = d[0].length - d[1].length,
                lhs = "",rhs = "";
            
            if(lhsDifference > 0){
                lhs = Array(lhsDifference).join("_") + d[0];
            }else{
                lhs = d[0];
            }
            if(rhsDifference > 0){
                rhs = Array(rhsDifference).join("_") + d[1];
            }else{
                rhs = d[1];
            }
            return [lhs,rhs];
        });

        return alignedPairs;
    };

    /**
       @method initContainer
       @purpose select or create a container
       @param containerName The id of the container. ie: node
       @note the containerName does not include the #
    */
    util.selectOrShare = function(containerName,parent){
        var container;
        if(parent === undefined) parent = d3.select("svg");        
        container = parent.select("#"+containerName);
        if(container.empty()){
            container = parent.append("g")
                .attr("id",containerName);
        }
        return container;
    }


    util.drawGroup = function(globalData,container,className,data,xLocation,groupWidth){
        var boundGroup = container.selectAll("."+className)
            .data(data,function(d){ return d.id; });
        boundGroup.exit().remove();
        var entryGroup = boundGroup.enter().append("g")
            .classed(className, true)
            .attr("transform",function(d,i){
                return "translate(" + xLocation + "," + (150 + i * 100) + ")";
            })

        
        entryGroup.append("rect")
            .attr("width",groupWidth)
            .attr("height",50)
            .style("fill",globalData.colours.lightBlue)
            .style("opacity",0)
            .attr("rx",0)
            .attr("ry",0)
            .transition().duration(250)
            .delay(function(d,i){ return i * 30 })
            .attr("rx",10)
            .attr("ry",10)
            .style("opacity",1);


        entryGroup.append("text")
            .style("text-anchor","middle")
            .attr("transform","translate(" + (groupWidth * 0.5) + ",25)")
            .text(function(d){ return d.id + " : " + d.name; })
            .style("fill","white")
            .style("opacity",0)
            .transition().delay(function(d,i){
                return 100 + i * 10;
            }).duration(500)
            .style("opacity",1);

        
        return boundGroup;
    };

    
    return util;
});
