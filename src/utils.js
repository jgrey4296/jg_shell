/**
   Defines general utilities to use across projects
   @module utils
*/
import _ from 'lodash';

/**
   @alias module:utils
*/
let util = {};

/**
   convert a string representation of an operator to its normal form
   @param {String} operatorName See ReteComparisonOperators
   @deprecated
   @function
*/
util.operatorToString = function(operatorName){
    let conversion = {
        "EQ" : "==",
        "LT" : "<",
        "GT" : ">",
        "LTE" : "<=",
        "GTE" : ">=",
        "NE" : "!=="
    };

    if (conversion[operatorName]){
        return conversion[operatorName];
    }
    
    console.warn("No conversion for operator:",operatorName);
    return operatorName;
};

/**
   Take a selection, append a wrapping classname,
   offset by a global, and invidual amount, set a colour,
   and use a passed in function to fill the texts
   returning the resulting texts
   @param boundDom
   @param className
   @param verticalOffset
   @param nodeHeight
   @param verticalSeparator
   @param horizontalOffset
   @param nodeWidth
   @param colour
   @param textFunction
   @param textColour
   @function
*/
util.annotate = function(boundDom,className,
                         verticalOffset,nodeHeight,verticalSeparator,
                         horizontalOffset,nodeWidth,colour,textFunction,textColour){

    //Exit Selection:
    boundDom.exit().remove();

    //enter selection:
    let enter = boundDom.enter().append("g").classed(className,true);

    //create new
    enter.append("rect")
        .classed(className + "rect", true);
    enter.append("text")
        .classed(className + "text", true)
        .attr("dy","1.4em");
    

    //update:
    boundDom.attr("transform",(e,i) => {
        return "translate(" + horizontalOffset + ","
            + ((verticalOffset + (i * (nodeHeight + verticalSeparator)))) + ")";
    });
    boundDom.selectAll("."+className+"rect")
        .attr("width",nodeWidth - (horizontalOffset * 2))
        .attr("height",nodeHeight)
        .style("fill",colour)
        .attr("rx",10).attr("ry",10);

    
    let texts = boundDom.selectAll("."+className+"text")
        .attr("transform","translate(" + horizontalOffset + "," + (nodeHeight * 0.2) + ")")
        .text(textFunction)
    //todo: parameterise this:
        .style("fill",textColour || "white");

    return texts;
};


/**
   repeatedly truncate text until it fits in a certain amount of space;
   @param d
   @function
*/
util.truncateDrawnText = function(d){
    // TODO: customise
    let bbox = this.getBBox();
    let maxLength = d.name.length - 4;
    while ( bbox.wdith > 10 && maxLength > 10){
        d.shortName = d.name.slice(0,maxLength) + "...";
        //d3.select(this).text(d.shortName);
        bbox = this.getBBox();
        maxLength -= 2;
    }
};

export { util };
