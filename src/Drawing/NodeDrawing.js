define(['underscore','d3','utils','./DrawUtils'],function(_,d3,util,DrawUtils){
    "use strict";
    var NodeDrawInterface = {},
        columnNames = ["Parents","Node","Children"];

    /**
       @function drawNode
       @param globalData 
       @param node
       @purpose main draw function for a standard GraphNode instance of the shell
    */
    NodeDrawInterface.drawNode = function(globalData,nodeToDraw){
        const standardData = {
            nodeTextHeight : 20,
            nodeHeightOffset : 30,
            nodeTextSeparator : 2,
            colHeight : globalData.usableHeight - 150,
            colWidth : globalData.calcWidth(globalData.usableWidth,columnNames.length),
            halfWidth : globalData.halfWidth(),
            globalData : globalData,
            //Get Data from the node:
            nodeDescriptions : nodeToDraw.getDescriptionObjects("id name values tags annotations".split(" ")),
            childrenData : _.keys(nodeToDraw.children).map(d=>globalData.shell.getNode(d)),
            parentsData : _.keys(nodeToDraw.parents).map(d=>globalData.shell.getNode(d))
        };

        //Non-const variables
        var mainContainer = DrawUtils.createOrShare('mainContainer'),
            //Select (or create) and bind the node
            node = DrawUtils.createOrShare('node',mainContainer,function(newContainer){
                //function called if creating rather than sharing
                newContainer.append("rect").attr("id","nodeEnclosingRect")
                    .attr("transform",`translate(${standardData.colWidth * -0.5},0)`)
                    .style("fill",globalData.colours.darkBlue)
                    .attr("rx",0)
                    .attr("ry",0)
                    .transition()
                    .attr("width",standardData.colWidth)
                    .attr("rx",10)
                    .attr("ry",10);
                
            }).attr("transform",`translate(${standardData.halfWidth},100)`);

        //.attr("height",(nodeText.length * (nodeTextHeight + nodeTextSeparator) + nodeHeightOffset))
        
        //remove all outdated text
        node.selectAll(".nodeText").remove();
        node.select("#nodeEnclosingRect").attr("height",10);
        
        //bind and draw the description groups
        //node.selectAll(".descGroup").remove();
        var boundText = node.selectAll(".descGroup").data(standardData.nodeDescriptions),            
            enter = boundText.enter().append("g").classed("descGroup",true);

                
        boundText.exit().remove();

        //draw the internals of each description group
        boundText.each(function(d,i){
            DrawUtils.drawStandardObject(standardData,d3.select(this),d,i);
        });

        //get the total bounding box height for the node:
        var bboxHeight = node[0][0].getBoundingClientRect().height;
        //console.log("bbox height:",bboxHeight);
        //set it as the total height for the groups internal rect:
        node.select("#nodeEnclosingRect").attr("height",bboxHeight);
        

         //draw its parents
        var parents = DrawUtils.drawGroup(globalData,mainContainer, "parent", standardData.parentsData, (globalData.halfWidth() - (standardData.colWidth * 2)), standardData.colWidth),
            //draw children
            children = DrawUtils.drawGroup(globalData,mainContainer, "child", standardData.childrenData, (globalData.halfWidth() + standardData.colWidth), standardData.colWidth);


        //Terrible hack to allow for click interaction:
        children.on('click',function(d){
            //console.log("Clicked on:",d);
            globalData.shell.cd(d.id);
            globalData.commands.node.draw(globalData,[]);
        });
        
        parents.on('click',function(d){
            globalData.shell.cd(d.id);
            globalData.commands.node.draw(globalData,[]);
        });

        
        // //figure out parent path:
        // var path = DrawUtils.pathExtraction(globalData,10).join(" --> ");
        // var pathText = d3.select("#pathText");
        // if(pathText.empty()){
        //     pathText = d3.select("svg").append("text").attr("id","pathText")
        //         .style("fill","white")
        //         .attr("transform","translate(" + (globalData.usableWidth * 0.5) + ",50)")
        //         .style("text-anchor","middle");
        // }
        // //use the figured out path
        // pathText.text(path);
    };


    /**
       @function cleanup
       @purpose Remove anything that drawNode creates
    */
    NodeDrawInterface.cleanup = DrawUtils.cleanup.bind({},".node",".parent",".child");

    return NodeDrawInterface;
});
