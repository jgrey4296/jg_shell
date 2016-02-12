/**
   @file NodeCommands
   @purpose to define the user actions that can be performed on a typical node in the shell
*/

define(['d3','utils','underscore'],function(d3,util,_){
    "use strict";
    var columnNames = ["Parents","Node","Children"];
    
    //All of the commands for the normal node mode of the shell
    var nodeCommands = {
        //The draw command
        "draw" : function(globalData,values){
            var colWidth = globalData.calcWidth(globalData.usableWidth,columnNames.length),
                halfWidth = globalData.halfWidth(),
            //get the data:
                cwdData = globalData.shell.cwd,
                nodeText = globalData.shell.getListsFromNode(cwdData,['id','name','values','tags','annotations']),
                nodeTextHeight = 20,
                nodeTextSeparator = 2,
                childrenData = _.keys(cwdData.children).map(function(d){
                    return this.allNodes[d];
                },globalData.shell),
                parentsData = _.keys(cwdData.parents).map(function(d){
                return this.allNodes[d];
                },globalData.shell),            
            //if necessary, init the containers
                mainContainer = util.selectOrShare('mainContainer',undefined,d3),
            //draw the node
                node = mainContainer.selectAll(".node").data([cwdData],function(d){ return d.id; }),
            //place in the centre
                enterNode = node.enter().append("g").classed("node",true)
                .attr("transform","translate(" + halfWidth + ",100)");

            //Removal:
            node.exit().remove();
            node.selectAll(".nodeText").remove();
            
            //Rectangle offset to be in the middle
            enterNode.append("rect")
                .attr("transform","translate("+ (colWidth * -0.5) +",0)")
                .style("fill",globalData.colours.darkBlue)
                .attr("rx",0)
                .attr("ry",0)
                .transition()
                .attr("rx",10)
                .attr("ry",10);

            node.selectAll("rect")
                .attr("width",colWidth)
                .attr("height",(nodeText.length * (nodeTextHeight + nodeTextSeparator) + 30));

            //Draw the node's text:
            //console.log("NodeText:",nodeText);
            var boundText = node.selectAll(".nodeText").data(nodeText),
                enter = boundText.enter().append("g").classed("nodeText",true);

            //add a rectangle and text element for each line
            enter.each(function(d,i){
                if(d.length === 0) { return; }
                
                d3.select(this).append("rect")
                    .attr("transform","translate(" + (colWidth * -0.4) +",0)")
                    .attr("width",(colWidth * 0.8))
                    .attr("height",(nodeTextHeight))
                    .style("fill",globalData.colours.darkerBlue);

                d3.select(this).append("text").classed("nodeTextActual",true)
                    .style("text-anchor","middle")
                    .style("fill",globalData.colours.textBlue)
                    .attr("transform","translate(" + (0) + "," + (nodeTextHeight * 0.75) + ")");
                    //.attr("transform","translate(" + (colWidth * 0.35) + "," + (nodeTextHeight * 0.75) + ")");

            });
            
            //update
            node.selectAll(".nodeText").attr("transform",function(d,i){
                return "translate(" + (0) + "," + (15 + (i * (nodeTextHeight + nodeTextSeparator))) + ")";
            });

            var texts = node.selectAll(".nodeTextActual")
                .text(function(d){
                    return d;
                });


            util.wrapText(texts,(colWidth * 0.6),d3);
            
            //draw its parents
            var parents = drawGroup(globalData,mainContainer, "parent", parentsData, (globalData.halfWidth() - (colWidth * 2)), colWidth);
            //draw children
            var children = drawGroup(globalData,mainContainer, "child", childrenData, (globalData.halfWidth() + colWidth), colWidth);


            //Terrible hack to allow for click interaction:
            children.on('click',function(d){
                //console.log("Clicked on:",d);
                globalData.shell.cd(d.id);
                nodeCommands.draw(globalData,[]);
            });

            parents.on('click',function(d){
                globalData.shell.cd(d.id);
                nodeCommands.draw(globalData,[]);
            });

            
            //figure out parent path:
            var path = pathExtraction(globalData,10).join(" --> ");
            var pathText = d3.select("#pathText");
            if(pathText.empty()){
                pathText = d3.select("svg").append("text").attr("id","pathText")
                    .style("fill","white")
                    .attr("transform","translate(" + (globalData.usableWidth * 0.5) + ",50)")
                    .style("text-anchor","middle");
            }
            pathText.text(path);

            
        },
        "cleanup" : function(globalData, values){
            d3.selectAll(".node").remove();
            d3.selectAll(".parent").remove();
            d3.selectAll(".child").remove();
        },
        "printNode" : function(globalData,values){
            console.log(globalData.shell.cwd);
        },
        "printShell" : function(globalData,values){
            console.log(globalData.shell);
        },
        //new -> addNode,
        "new" : function(globalData,values,sourceId){
            //Expand out simplifications
            var target = values[0];
            if(target === "child") { target = "children"; }
            if(target === "parent") { target  = "parents"; }
            console.log("Target:",target);
            globalData.shell.addNode(values[2],target,values[1],values.slice(3),sourceId);
        },
        //node creation Shortcuts:
        "nc" : function(globalData,values){
            var chars = {
                "n" : "node",
                "i" : "institution",
                "r" : "role",
                "a" : "activity",
                "rc": "rulecontainer",
            };
            if(chars[values[0]]){
                globalData.shell.addNode(values[1],'children',chars[values[0]],values.slice(2));
            }else{
                globalData.shell.addNode(values[1],'children',values[0],values.slice(2));
            }
        },
        "np" : function(globalData,values){
            var chars = {
                "n" : "node",
                "i" : "institution",
                "r" : "role",
                "a" : "activity",
                "rc": "rulecontainer",
            };
            if(chars[values[0]]){
                globalData.shell.addNode(values[1],'parents',chars[values[0]],values.slice(2));
            }else{
                globalData.shell.addNode(values[1],'parents',values[0],values.slice(2));
            }
        },
        //New Child Node, ncn:
        "ncn" : function(globalData,values){
            globalData.shell.addNode(values[0],'children','node');
        },
        //new child institution: nci
        "nci" : function(globalData,values){
            globalData.shell.addNode(values[0],'children','institution');
        },
        //------------------------------
        //rm -> removeNode,
        "rm" : function(globalData,values,sourceId){
            globalData.shell.rm(values[0],values[1],values[2],sourceId);
        },
        //cd -> cd
        "cd" : function(globalData,values){
            globalData.shell.cd(values[0]);
        },
        //set -> setParameter
        "set" : function(globalData,values,sourceId){
            globalData.shell.setParameter(values[0],values[1],values[2],sourceId);
        },
        //link -> link
        "link" : function(globalData,values,sourceId){
            var target = values[0];
            if(target === 'child') { target = 'children'; }
            if(target === 'parent') { target = 'parents'; }
            globalData.shell.link(target,values[1],false,sourceId);
        },
        "linkr" : function(globalData,values,sourceId){
            var target = values[0];
            if(target === 'child') { target = 'children'; }
            if(target === 'parent') { target = 'parents'; }
            globalData.shell.link(target,values[1],true,sourceId);

        },
        //rename -> rename
        "rename" : function(globalData,values){
            globalData.shell.rename(values[0]);
        },
        "help" : function(globalData,values){
            return {
                "help#general" : ["", "Display General Commands Help"],
                "new"   : ["$target $type $name", "Add a node to the graph."],
                "nc"    : [ "[n | i | r | a ] $name", " Shortcuts for adding children. Nodes, institutions, roles, activities."],
                "np"    : [ "[n | i | r | a ] $name", " Shortcuts for adding parents."],
                "[ncn | nci]" : [ "$name", "new child node/institution."],
                "rm"    : [ "$id", " Remove a node by id number."],
                "cd"    : [ "[.. | $name | $id]", " Move to a node by name or id."],
                "rename": [ "$name", " Rename a node."],
                "set"   : [ "$field $parameter $value", " Set a value of a node. ie: set tag type myType."],
                "link"  : [ "$target $id", " Link two existing nodes."],
                "linkr" : [ "$target $id", " Link two existing nodes reciprocally."],
                "search" : [ "$target $pattern $focusType", " Search for all nodes where a pattern applied to a type in the target field matches."],
            };
        }
    };

    //--------------------
    //Utils

    //todo: group together and annotate if there are too many nodes to display
    var drawGroup = function(globalData,container,className,data,xLocation,groupWidth){
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


    //from the cwd, work up the roots to create a path
    var pathExtraction = function(globalData,depth){
        var path = [];
        var shell = globalData.shell;
        var cwd = shell.cwd;
        while(cwd._originalParent !== undefined && depth > 0){
            path.push(cwd.name + "(" + cwd.id +")");
            cwd = shell.allNodes[cwd._originalParent];
            depth--;
        }
        return path.reverse();
    };

    
    return nodeCommands;
});


        
//     //Get conditionless rules
//     //get actionless rules
//     //get testless conditions
//     //get ruleless conditions

//     //Get the next and previous rules by id
//     "next" : function(sh,values){
//         sh.moveTo(sh.cwd + 1);
//     },
//     "prev" : function(sh,values){
//         sh.moveTo(sh.cwd - 1);
//     },
