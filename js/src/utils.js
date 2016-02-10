/**
   @file utils
   @purpose defines general utilities to use across projects
*/
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore'],function(_){
    "use strict";
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
            var lhsDifference = d[1].length - d[0].length,
                rhsDifference = d[0].length - d[1].length,
                lhs = "",
                rhs = "";
            
            if(lhsDifference > 0){
                lhs = new Array(lhsDifference).join("_") + d[0];
            }else{
                lhs = d[0];
            }
            if(rhsDifference > 0){
                rhs = new Array(rhsDifference).join("_") + d[1];
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
    util.selectOrShare = function(containerName,parent,d3){
        if(!d3) throw new Error("No d3");
        var container;
        if(parent === undefined) parent = d3.select("svg");        
        container = parent.select("#"+containerName);
        if(container.empty()){
            container = parent.append("g")
                .attr("id",containerName);
        }
        return container;
    };

    //Generic draw group function, modes will typically create their own version
    util.drawGroup = function(globalData,container,className,data,xLocation,groupWidth){
        console.log("drawing:",data);
        var heightOfNode = util.calculateNodeHeight((globalData.usableHeight - 100),
                                                    20,
                                                    data.length),
            animationLength = 100;
        var boundGroup = container.selectAll("."+className)
            .data(data,function(d,i){ return d.id; });

        //exit selection
        boundGroup.exit().selectAll("rect")
            .transition()
            .duration(animationLength)
            .style("fill","red");

        boundGroup.exit().selectAll("text").transition()
            .style("opacity",0);
        
        boundGroup.exit().transition().delay(animationLength).remove();

        //entry selection
        var entryGroup = boundGroup.enter().append("g")
            .classed(className, true)
            .attr("transform","translate(" + xLocation + ",100)");


        //create
        entryGroup.append("rect")
            .attr("width",0)
            .attr("height",0)
            .style("fill",globalData.colours.lightBlue)
            .style("opacity",0)
            .attr("rx",0)
            .attr("ry",0);
        

        entryGroup.append("text")
            .style("text-anchor","middle")
            .style("fill","white")
            .style("opacity",0);


        //update selection
        //transition to updated sizes etc
        boundGroup.transition().delay(animationLength).attr("transform",function(d,i){
            return "translate(" + xLocation + "," + (100 + (i * (heightOfNode + 20))) + ")";
        })
            .selectAll("text")
            .attr("transform","translate(" + (groupWidth * 0.5) + "," +
                  (heightOfNode * 0.5) + ")");

        
        boundGroup.selectAll("rect")
            .transition().delay(animationLength*3).duration(animationLength)
            .attr("width",groupWidth)
            .attr("height",heightOfNode)
            .attr("rx",10)
            .attr("ry",10)
            .style("opacity",1);

        boundGroup.selectAll("text").transition().delay(animationLength*3).duration(animationLength)
            .text(function(d){ return d.id + " : " + d.name; })
            .style("opacity",1);
        
        return boundGroup;
    };

    //calculate, given an size of an area, how far apart node are,
    // and the number of items: the size of each individual node
    util.calculateNodeHeight = function(amtOfSpace,separatorSpace,dataLength){
        if(dataLength > 0){
            return (amtOfSpace - (dataLength * separatorSpace)) / dataLength;
        }else{
            return (amtOfSpace - separatorSpace);
        }
    };

    util.operatorToString = function(operatorName){
        var conversion = {
            "EQ" : "==",
            "LT" : "<",
            "GT" : ">",
            "LTE" : "<=",
            "GTE" : ">=",
            "NE" : "!=="
        };

        if(conversion[operatorName]){
            return conversion[operatorName];
        }else{
            console.warn("No conversion for operator:",operatorName);
            return operatorName;
        }
    };

    //Take a selection, append a wrapping classname,
    //offset by a global, and invidual amount, set a colour,
    //and use a passed in function to fill the texts
    //returning the resulting texts
    util.annotate = function(boundDom,className,
                             verticalOffset,nodeHeight,verticalSeparator,
                             horizontalOffset,nodeWidth,colour,textFunction,textColour){

        //Exit Selection:
        boundDom.exit().remove();

        //enter selection:
        var enter = boundDom.enter().append("g").classed(className,true);

        //create new
        enter.append("rect")
            .classed(className + "rect", true);
        enter.append("text")
            .classed(className + "text", true)
            .attr("dy","1.4em");
        

        //update:
        boundDom.attr("transform",function(e,i){
            return "translate(" + horizontalOffset + ","
                + ((verticalOffset + (i * (nodeHeight + verticalSeparator)))) + ")";
        });
        boundDom.selectAll("."+className+"rect")
            .attr("width",nodeWidth - (horizontalOffset * 2))
            .attr("height",nodeHeight)
            .style("fill",colour)
            .attr("rx",10).attr("ry",10);

        var texts = boundDom.selectAll("."+className+"text")
            .attr("transform","translate(" + horizontalOffset + "," + (nodeHeight * 0.2) + ")")
            .text(textFunction)
        //todo: parameterise this:
            .style("fill",textColour || "white");

        return texts;
    };

    //repeatedly truncate text until it fits in a certain amount of space;
    //TODO: customise
    util.truncateDrawnText = function(d){
        var bbox = this.getBBox();
        var maxLength = d.name.length - 4;
        while( bbox.wdith > 10 && maxLength > 10){
            d.shortName = d.name.slice(0,maxLength) + "...";
            //d3.select(this).text(d.shortName);
            bbox = this.getBBox();
            maxLength -= 2;
        }
    };

    //Take a text, and wrap it onto multiple 'lines'
    util.wrapText = function(textSelection,width,d3){
        //console.log("Wrapping selection:",textSelection);
        //TODO: check that the selection IS of texts?
        textSelection.each(function(){
                var text = d3.select(this),
                    words = text.text().split(/\s+/),
                    word,//current word
                    line = [],//current line
                    y = text.attr("y"),
                    dy = parseFloat(text.attr("dy")) || parseFloat("1.4em"),
                    tspan = text.text(null).append("tspan")
                    .attr("x",0)
                    .attr("y",y)
                    .attr("dy",dy);

            //console.log("Wrapping:",text,text.text());
            
                while(word = words.shift()){
                    line.push(word);
                    tspan.text(line.join(" "));
                    if(tspan.node().getComputedTextLength() > width){
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan").attr("x",20)
                            .attr("dy",dy +"em").text(word);
                    }
                }
            });
        };


        
        return util;
    });
