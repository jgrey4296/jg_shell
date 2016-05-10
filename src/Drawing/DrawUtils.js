
define(['lodash','d3'],function(_,d3){
    "use strict";
    /**
       Utilities to Assist with Drawing to do
       @requires lodash
       @requires d3
       @exports Drawing/DrawUtils
     */
    var DrawUtils = {};

    /**
       Common Data Constructor
       The DrawUtils functions assume a standard set of data, which can be customised. 
       This constructor provides an initial form of that data, and documents it
    */
    DrawUtils.CommonData = function(globalData,data,columns){
        //the internal vertical separator of a node
        this.nodeDataSeparator = 5;
        //the external vertical separator between nodes
        this.groupDataSeparator = 2;
        //horizontal border to wrap a node
        this.widthAddition = 0;
        //The number of vertical columns to use on the screen
        this.numOfColumns = columns || 5;
        //The width of each column
        this.colWidth = globalData.calcWidth(globalData.usableWidth,this.numOfColumns);
        //Half of a column, to allow centring
        this.halfCol = Math.floor(this.colWidth * 0.5);
        //Centre point of the screen, for offsetting relative to
        this.halfWidth = globalData.halfWidth();
        //the data that will actually be drawn
        this.data = data;
        //a reference to the global data object
        this.globalData = globalData;
        //transform function specifying initial xoffset
        //for centring
        this.groupNodeTransform = (d=>d[0][0].getBBox().width*0.5);

        //Default offsets:
        this.leftOffset = (this.halfWidth - (this.colWidth)) - this.halfCol;
        this.doubleLeftOffset = (this.halfWidth - (this.colWidth )) - (3.5 * this.halfCol);
        this.rightOffset = (this.halfWidth + this.colWidth) + this.halfCol;
        this.doubleRightOffset = (this.halfWidth + this.colWidth) + (3.5 * this.halfCol);

    };

    
    /**
       Generic cleanup function, will typically be bound for each specific draw style
       DrawUtils.cleanup.bind({},".node",".parent",".child")();
       @function
    */
    DrawUtils.cleanup = function(...toCleanUp){
        d3.selectAll(toCleanUp.join(", ")).remove();
    };

    /**
       Construct a string describing the path from the cwd to the root of the shell
       @function
       @param globalData
       @param depth
    */
    DrawUtils.pathExtraction = function(globalData,depth){
        var path = [];
        var shell = globalData.shell;
        var cwd = shell.cwd;
        while(cwd !== undefined && _.keys(cwd.linkedNodes).length > 0  && depth > 0){
            path.push(`${cwd.name}(${cwd.id})`);
            let parent = _.find(_.toPairs(cwd.linkedNodes),d=>/parent/.test(d[1])) || [];
            cwd = shell.allNodes[parent[0]];
            depth--;
        }
        return path.reverse();
    };

    /**
       Select or create a container
       @function
       @param containerName The id of the container. ie: node
       @param parent
       @param setupFunc
       @param type
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
       Take a selection of individual text objects, and wrap them within a defined width
       @function 
       @param textSelection
       @param width
    */
    DrawUtils.wrapText = function(textSelection,width){
        //console.log("wrap text on :",textSelection);
        var wrapPromise = Promise.resolve();
        //console.log("Wrapping selection:",textSelection);
        //TODO: check that the selection IS of texts?
        textSelection.each(function(){
            var text = d3.select(this);
            wrapPromise.then(function(){
                var words = text.text().split(/\s+/),
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
        });
        return wrapPromise;
    };


    /**
       Draws a single node. Node Data can include color fields
       @function
       @param container
       @param {Array.<{name : String, values : Array}>} nodeData
       @param groupData The CommonData 
       @param offsetName The fieldName specifying vertical separation
    */
    DrawUtils.drawSingleNode = function(container,nodeData,groupData,offsetName="nodeDataSeparator"){
        //The initial promise
        var drawPromise = new Promise(function(resolve,reject){
            //create the rectangle if it doesnt exist
            if(container.select("#EnclosingRect").empty()){
                container.append("rect").attr("id","EnclosingRect")
                    .style("fill",groupData.globalData.colours.darkBlue)
                    .attr("rx",10)
                    .attr("ry",10)
                    .attr("width",groupData.colWidth + (groupData.widthAddition * 2))
                    .attr("height",0)
                    .attr("transform",`translate(${-(groupData.halfCol+groupData.widthAddition)},0)`);
            }
            //console.log("draw detail: ",container, nodeData);
            var bound = container.selectAll(".nodeData").data(nodeData);
            bound.enter().append("g").classed("nodeData",true);
            bound.exit().remove();
            //console.log("bound:",bound);
            //when animating, resolve will go in the end of the animation
            resolve(bound);
        });

        //Wait on initial drawing before drawing individual data
        return drawPromise.then(function(boundGroup){
            return DrawUtils.drawIndividualData(boundGroup,groupData)
                .then(function(){ return boundGroup;});
        }).then(function(boundGroup){
            //tidy up the group
            //console.log("selection:",boundGroup);
            //After all drawing, tidy
            var offset = 0;
            boundGroup.each(function(d,i){
                var g = d3.select(this),
                    bbox = this.getBBox(),
                    priorBbox = this.previousElementSibling.getBBox();
                offset += i===0 ? groupData[offsetName] : priorBbox.height + groupData[offsetName];
                g.attr("transform",`translate(0,${Math.floor(offset)})`);
            });
            return boundGroup;
        }).then(function(boundGroup){
            //expand enclosing rectangle when everything is in place
            container.select("#EnclosingRect").attr("height",0);
            var tempHeight = container[0][0].getBBox().height + 2*groupData[offsetName];
            container.select("#EnclosingRect").attr("height",tempHeight);
            //console.log("Draw single node completing:",nodeData);
            return container;
        }).catch(function(e){
            console.warn("Single Node Error:",e);
        });
    };
    

    /**
       Draw Data of a node
       @function
       @param containerSelection Where each datum =name: String, values : []
       @param groupData The CommonData
     */
    DrawUtils.drawIndividualData = function(containerSelection,groupData){
        //console.log("Draw individual data:",containerSelection);
        var promiseArray = [];

        //Sequence on the promise for each element in the selection
        containerSelection.each(function(d){
            var cur = d3.select(this);
            //add another step to the array of promises:
            promiseArray.push((new Promise(function(resolve,reject){
                //add the heightless rectangle if necessary
                if(cur.select("rect").empty()){
                    cur.append("rect");
                }
                var colour = d.background && groupData.globalData.colours[d.background] ? groupData.globalData.colours[d.background] : groupData.globalData.colours.lightBlue;
                var rect = cur.select("rect")
                    .attr("transform",`translate(${-groupData.halfCol},-5)`)
                    .attr("width",groupData.colWidth)
                    .style("fill",colour)
                    .attr("height",0)
                    .attr("rx",10)
                    .attr("ry",10);
                
                var textArray;
                if(d.values !== undefined){
                    textArray = [`| ${d.name} |`].concat(_.values(d.values));
                }else{
                    textArray = [d.name];
                }
                //console.log("Text Array:",textArray);
                var boundTexts = cur.selectAll("text").data(textArray);
                boundTexts.exit().remove();
                boundTexts.enter().append("text")
                    .style("text-anchor","middle");
                boundTexts.text(e=>e);

                //again, animation will hold the resolve
                resolve(boundTexts);
            })).then(function(boundTexts){
                return DrawUtils.wrapText(boundTexts,groupData.colWidth)
                    .then(function(){ return boundTexts;});
            }).then(function(boundTexts){
                //offset the texts
                var offset = 0;
                boundTexts.each(function(e,i){
                    if(this.previousElementSibling !== undefined && this.previousElementSibling !== null){
                        var text = d3.select(this),
                            bbox = this.previousElementSibling.getBBox();
                        offset += i===0 ? groupData.nodeDataSeparator : bbox.height + groupData.nodeDataSeparator;                    
                        text.attr('transform',`translate(0,${offset})`);
                    }
                });
            }).catch(function(e){
                console.warn("Ind Group Error:",e);
            }));
        });

        //After all text is written
        return Promise.all(promiseArray).then(function(){
            //expand rects
            containerSelection.each(function(e,i){
                var g = d3.select(this),
                    tempHeight = this.getBBox().height+5;
                //expand rectangle of the group
                g.select("rect").attr("height",tempHeight);                
            });
        }).then(function(){ return containerSelection; })
            .catch(function(e){
                console.warn("AllPromise Ind Group Error:",e);
            });
    };

    //--------------------

    /**
       Draws a group
       @function
       @param container in which to draw
       @param {Array.<Object>} data 
       @param commonData The settings object
       @param descriptionFunc d=>[ |name : String, values : []| ]
     */
    DrawUtils.drawGroup = function(container,commonData,descriptionFunction){
        //console.log("Group draw:",container,data);
        let groupPromise = new Promise(function(resolve,reject){
            //create the individual nodes
            let boundNodes =  container.selectAll(".groupNode").data(commonData.data);
            boundNodes.enter().append("g").classed("groupNode",true)
                .on("click",function(d){
                    console.log("click:",d);
                    commonData.globalData.shell.cd(d[0].nodeId);
                    commonData.globalData.lookupOrFallBack("draw")(commonData.globalData);
                });
            boundNodes.exit().remove();
            //console.log("Bound nodes:",boundNodes);
            resolve(boundNodes);
        });


        //When nodes have been created
        return groupPromise.then(function(boundNodes){
            let promiseArray = [];
            //console.log("Post initial group promise:",boundNodes);
            //draw each individual node
            boundNodes.each(function(d,i){
                let cur = d3.select(this),
                    describedData = descriptionFunction !== undefined ? descriptionFunction(d) : d instanceof Array ? d : [{name:d}];
                
                promiseArray.push(DrawUtils.drawSingleNode(cur,describedData,commonData)
                                  .then(function(){
                                      //console.log("Adding:",cur,"To promise array");
                                      return cur;
                                  }));
            });
            return promiseArray;
        }).then(function(promiseArray){
            //Wait on all the nodes to be drawn
            return Promise.all(promiseArray).then(function(eachElement){
                //console.log("All promises fulfilled:",eachElement);
                //Then offset them
                let offset = 0;
                eachElement.forEach(function(d,i){
                    //offset
                    if(d[0][0].previousElementSibling !== null){
                        let bbox = d[0][0].previousElementSibling.getBBox(),
                            xOffset = commonData.groupNodeTransform !== undefined ? commonData.groupNodeTransform(d) : 0;                        
                        offset += i === 0 ? commonData.groupDataSeparator : bbox.height + commonData.groupDataSeparator;

                        d.attr("transform",`translate(${Math.floor(xOffset)},${Math.floor(offset)})`);
                    }
                });
            });
        }).catch(function(e){
            console.warn("Group Data:",commonData.data);
            console.warn("Group Error:",e);
        });
    };
    

    /**
       Extracts then draws the path of the cwd
       @function 
       @param globalData
     */
    DrawUtils.drawPath = function(globalData){
        //figure out parent path:
        let path = DrawUtils.pathExtraction(globalData,10).join(" --> "),
            pathText = d3.select("#pathText");
        if(pathText.empty()){
            pathText = d3.select("svg").append("text").attr("id","pathText")
                .style("fill","white")
                .attr("transform","translate(" + (Math.floor(globalData.usableWidth * 0.5)) + ",50)")
                .style("text-anchor","middle");
        }
        //use the figured out path
        pathText.text(path);
    };

    
    return DrawUtils;
});
