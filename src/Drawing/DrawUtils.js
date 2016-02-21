define(['underscore','d3'],function(_,d3){

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
       @function drawGroup Generic function to draw a group of vertical nodes
       @param container The Container to draw the group inside of
       @param className General class all subelements will describe themselves as
       @param data array of nodes(?) used to populate the group
       @param xLocation translation amount relative to the container
       @param groupWidth the maximum width of the group to be drawn
       @todo group together and annotate if there are too many nodes to display
    */
    DrawUtils.drawGroup = function(globalData,container,className,data,xLocation,groupWidth){
        //console.log("drawing:",data);
        var amtOfSpace, heightOfNode,
            animationLength = 100;
        if(data.length > 0){
            amtOfSpace = (globalData.usableHeight - 100);
            heightOfNode = (amtOfSpace - (data.length * 20)) / data.length;
        }else{
            amtOfSpace = (globalData.usableHeight - 100);
            heightOfNode = (amtOfSpace - 20);
        }
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

        //create in the entry selection
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
        });
        
        container.selectAll("."+className).selectAll("rect")
            .transition().delay(animationLength*3).duration(animationLength)
            .attr("width",groupWidth)
            .attr("height",heightOfNode)
            .attr("rx",10)
            .attr("ry",10)
            .style("opacity",1);

        container.selectAll("."+className).selectAll("text")
            .transition().delay(animationLength*3).duration(animationLength)
            .attr("transform","translate(" + (groupWidth * 0.5) + "," +
                  (heightOfNode * 0.5) + ")")
            .text(function(d){ return d.id + " : " + d.name; })
            .style("opacity",1);
        
        return boundGroup;
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
                setupFunc(container);
            }
        }
        return container;
    };

    
    /**
       Draw a standardised object
       of { name : a::string, values : [b::string] }
     */
    DrawUtils.drawStandardObject = function(standardData,container,object,i){
        var numOfDescriptions = standardData.nodeDescriptions.length,
            availableHeight = standardData.colHeight,
            centreTransformX = standardData.colWidth * -0.4,
            transformY = 0,
            width = standardData.colWidth * 0.8,
            currentElement = container,
            textData = object.values === undefined ? [object.name] : [`| ${object.name} |`].concat(object.values),
            textHeight = 15;


        //Offset by everything above in this group
        transformY = i === 0 ? 0 : d3.select(currentElement[0][0].previousElementSibling)[0][0].getBoundingClientRect().bottom -100;

        container.attr('transform',`translate(0,${transformY})`);
        
        var rect = DrawUtils.createOrShare('enclosingRect',container,undefined,"rect")
            .attr("height",10)
            .attr("width",width)
            .attr("transform",`translate(${centreTransformX},0)`)
            .style("fill",standardData.globalData.colours.darkerBlue);

        //add the text
        container.selectAll("text").remove();
        var boundTexts = container.selectAll("text").data(textData);
        boundTexts.enter().append("text")
            //.attr("transform",(d,i)=>`translate(0,${(i+1)*textHeight})`)
            .text(d=>d)
            .style('text-anchor','middle')

        DrawUtils.wrapText(boundTexts,width);

        var offset = 0;
        boundTexts.each(function(d){
            var cur = d3.select(this);
                offset += d3.select(cur[0][0].previousElementSibling)[0][0].getBoundingClientRect().height + 5;
            cur.attr('transform',`translate(0,${offset})`);
        });
        
        //get the bounding box,
        //apply to the enclosing rectangle:
        rect.attr("height",container[0][0].getBoundingClientRect().height);

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


    
    return DrawUtils;
});
