define(['underscore','d3'],function(_,d3){
    "use strict";
    var DrawUtils = {};

    /**
       @function cleanup
       @purpose Generic cleanup function, will typically be bound for each specific draw style
       @example DrawUtils.cleanup.bind({},".node",".parent",".child")();
     */
    DrawUtils.cleanup = function(...toCleanUp){
        d3.selectAll(toCleanUp.join(", ")).remove();
    };


    /**
       @function pathExtraction
       @purpose construct a string describing the path from the cwd to the root of the shell
     */
    DrawUtils.pathExtraction = function(globalData,depth){
        var path = [];
        var shell = globalData.shell;
        var cwd = shell.cwd;
        while(cwd._originalParent !== undefined && depth > 0){
            path.push(`${cwd.name}(${cwd.id})`);
            cwd = shell.allNodes[cwd._originalParent];
            depth--;
        }
        return path.reverse();
    };

    /**
       @method selectOrShare
       @purpose select or create a container
       @param containerName The id of the container. ie: node
       @note the containerName does not include the #
    */
    DrawUtils.createOrShare = function(containerName,parent,setupFunc,type="g"){
        var container;
        if(parent === undefined) { parent = d3.select("svg"); }
        container = parent.select("#"+containerName);
        if(container.empty()){
            container = parent.append(type)
                .attr("id",containerName);
            if(setupFunc !== undefined){
                setupFunc(container,containerName);
            }
        }
        return container;
    };


    /**
       @function wrapText
       @purpose Take a selection of individual text objects, and wrap them within a defined width
     */
    DrawUtils.wrapText = function(textSelection,width){
        //console.log("Wrapping selection:",textSelection);
        //TODO: check that the selection IS of texts?
        textSelection.each(function(){
            var text = d3.select(this),
                words = text.text().split(/\s+/),
                word,//current word
                line = [],//current line
                y = text.attr("y"),
                dy = parseFloat(text.attr("dy")) || parseFloat("1.2em"),
                tspan = text.text(null).append("tspan")
                .attr("x",0)
                .attr("y",y)
                .attr("dy",dy);
            
            //console.log("Wrapping:",text,text.text());
            while(!_.isEmpty(words)){
                word = words.shift();
                line.push(word);
                tspan.text(line.join(" "));
                if(tspan.node().getComputedTextLength() > width){
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x",0)
                        .attr("dy",dy +"em").text(word);
                }
            }
        });
    };


    //
    DrawUtils.singleNode = function(container,nodeData,groupData){
        //console.log("draw detail: ",container, nodeData);
        var bound = container.selectAll(".nodeData").data(nodeData);
        bound.enter().append("g").classed("nodeData",true);
        bound.exit().remove();
        DrawUtils.drawIndividualData(bound,groupData);

        
        //After all drawing, tidy
        var offset = 0;
        bound.each(function(d,i){
            var g = d3.select(this);
            var bbox = g[0][0].previousElementSibling.getBBox();
            offset += i===0 ? groupData.nodeDataSeparator : bbox.height + groupData.nodeDataSeparator;
            //console.log(g[0][0].previousElementSibling.getBBox());
            g.attr("transform",`translate(0,${offset})`);
        });
    };

    //
    DrawUtils.drawIndividualData = function(containerSelection,groupData){
        containerSelection.each(function(d){
            var cur = d3.select(this);
            //add the heightless rectangle
            if(cur.select("rect").empty()){
                cur.append("rect");
            }
            cur.select("rect")
                .attr("width",groupData.colWidth)
                .attr("height",0);

            var textArray;
            if(d.values !== undefined){
                textArray = [`| ${d.name} |`].concat(_.values(d.values),["----"]);
            }else{
                textArray = [d.name];
            }

            var boundTexts = cur.selectAll("text").data(textArray);
            boundTexts.exit().remove();
            boundTexts.enter().append("text")
                .style("text-anchor","middle");

            boundTexts.text(e=>e);

            DrawUtils.wrapText(boundTexts,groupData.colWidth);

            //calculate positions
            var offset = 0;
            boundTexts.each(function(e,i){
                var t = d3.select(this),
                    bbox = t[0][0].previousElementSibling.getBBox();
                offset += i===0 ? groupData.nodeDataSeparator : bbox.height + groupData.nodeDataSeparator;
                t.attr("transform",`translate(0,${offset})`);
            });
            
        });
    };
    

    
    
    return DrawUtils;
});
