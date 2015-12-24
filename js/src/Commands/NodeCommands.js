/**
   @file NodeCommands
   @purpose to define the user actions that can be performed on a typical node in the shell
*/

define(['d3','utils'],function(d3,util){
    var columnNames = ["Parents","Node","Children"];
    
    //All of the commands for the normal node mode of the shell
    var nodeCommands = {
        //The draw command
        "draw" : function(globalData,values){
            var colWidth = globalData.calcWidth(globalData.usableWidth,columnNames.length);
            var halfWidth = globalData.halfWidth();
            //get the data:
            var cwdData = globalData.shell.cwd;
            var nodeText = globalData.shell.getListsFromNode(cwdData,['id','name','values','tags','annotations']);
            var nodeTextHeight = 20;
            var nodeTextSeparator = 2;
            
            var childrenData = _.keys(cwdData.children).map(function(d){
                return this.allNodes[d];
            },globalData.shell);
            var parentsData = _.keys(cwdData.parents).map(function(d){
                return this.allNodes[d];
            },globalData.shell);

            
            //if necessary, init the containers
            var mainContainer = util.selectOrShare('mainContainer',undefined,d3);

            //draw the node
            var node = mainContainer.selectAll(".node").data([cwdData],function(d){ return d.id; });
            //Removal:
            node.exit().remove();
            
            var enterNode = node.enter().append("g").classed("node",true)
                .attr("transform","translate(" + halfWidth + ",100)");
            enterNode.append("rect")

                .attr("transform","translate("+ (- (colWidth * 0.5)) +",0)")
                .style("fill",globalData.colours.darkBlue)
                .attr("rx",0)
                .attr("ry",0)
                .transition()
                .attr("rx",10)
                .attr("ry",10);

            node.selectAll("rect")
                .attr("width",colWidth).attr("height",(nodeText.length * (nodeTextHeight + nodeTextSeparator) + 30))
            
            node.selectAll(".nodeText").remove();
            //Draw the node's text:
            console.log("NodeText:",nodeText);
            var boundText = node.selectAll(".nodeText").data(nodeText);

            var enter = boundText.enter().append("g").classed("nodeText",true)

            enter.each(function(d,i){
                if(d.length === 0) return;
                
                d3.select(this).append("rect")
                    .attr("width",(colWidth * 0.8))
                    .attr("height",(nodeTextHeight))
                    .style("fill",globalData.colours.darkerBlue);

                d3.select(this).append("text").classed("nodeTextActual",true)
                    .style("text-anchor","middle")
                    .style("fill",globalData.colours.textBlue)
                    .attr("transform","translate(" + (colWidth * 0.4) + "," + (nodeTextHeight * 0.75) + ")");
            });

            
            //update
            node.selectAll(".nodeText").attr("transform",function(d,i){
                return "translate(" + (colWidth * -0.4) + "," + (15 + (i * (nodeTextHeight + nodeTextSeparator))) + ")";
            });

            node.selectAll(".nodeTextActual")
                .text(function(d){
                    return d;
                });

            //draw its parents
            var parents = drawGroup(globalData,mainContainer, "parent", parentsData, (globalData.halfWidth() - (colWidth * 2)), colWidth);
            //draw children
            var children = drawGroup(globalData,mainContainer, "child", childrenData, (globalData.halfWidth() + colWidth), colWidth);

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
        "inspect" : function(globalData,values){
            var id = Number(values.shift());
            //get the node of this number.
            d3.selectAll(".parent")
                .select("rect")
                    .transition().duration(500)
                    .style("fill",function(d){
                        if(d.id === id) return "blue";
                        return "red";
                    });

            d3.selectAll(".child")
                    .select("rect")
                    .transition().duration(500)
                    .style("fill",function(d){
                        if(d.id === id) return "blue";
                        return "red";
                    });
        },
        //new -> addNode,
        "new" : function(globalData,values){
            //Expand out simplifications
            var target = values[0];
            if(target === "child") target = "children";
            if(target === "parent") target  = "parents";
            console.log("Target:",target);
            globalData.shell.addNode(values[2],target,values[1],values.slice(3));
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
                globalData.shell.addNode(values[1],'children',chars[values[0]]);
            }else{
                globalData.shell.addNode(values[1],'children',values[0]);
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
                globalData.shell.addNode(values[1],'parents',chars[values[0]]);
            }else{
                globalData.shell.addNode(values[1],'parents',values[0]);
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
        "rm" : function(globalData,values){
            globalData.shell.rm(values[0]);
        },
        //cd -> cd
        "cd" : function(globalData,values){
            globalData.shell.cd(values[0]);
        },
        //set -> setParameter
        "set" : function(globalData,values){
            globalData.shell.setParameter(values[0],values[1],values[2]);
        },
        //link -> link
        //TODO: detect if recursive connection or not
        "link" : function(globalData,values){
            var target = values[0];
            if(target === 'child') target = 'children';
            if(target === 'parent') target = 'parents';
            globalData.shell.link(target,values[1],false);
        },
        "linkr" : function(globalData,values){
            var target = values[0];
            if(target === 'child') target = 'children';
            if(target === 'parent') target = 'parents';
            globalData.shell.link(target,values[1],true);

        },
        //rename -> rename
        "rename" : function(globalData,values){
            globalData.shell.rename(values[0]);
        },
        //Search:
        "search" : function(globalData,values){
            globalData.lastSetOfSearchResults = globalData.shell.search(values[0],values[1],values[2]);
        },
        "help" : function(globalData,values){
            return {
            "helpGeneral" : ["", "Display General Commands Help"],
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
