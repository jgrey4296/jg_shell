if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','d3'],function(_,d3){
    "use strict";
    /**
     To define the actions a user can perform regarding the retenet
     @exports Commands/ReteCommands
     @implements module:Commands/CommandTemplate
     */
    var reteCommands = {
        /** clear */
        "clear" : function(globalData,values){
            console.log("Clearing RETE");
            if(values[0] === 'complete'){
                globalData.shell.clearRete();
            }if(values[0] === 'history'){
                globalData.shell.clearHistory();
            }else{
                globalData.shell.clearProposedActions();
            }
        },
        /** draw */
        "draw" : function(globalData,values){
            //calculations:
            var colWidth = globalData.calcWidth(globalData.usableWidth,5);
            var halfWidth = globalData.halfWidth();
            
            //todo: draw... facts? tokens? possible actions?

            //draw asserted wmes -> actions
            var wmes = globalData.shell.reteNet.allWMEs.filter(function(d){
                return d !== undefined;
            });
            var actions = globalData.shell.reteNet.proposedActions;

            var wmeColumn = d3.select("#mainContainer").append("g")
                .attr("id","wmeColumn");
            var actionColumn = d3.select("#mainContainer").append("g")
                .attr("id","actionColumn");

            // var wmeNodeHeight = drawGroup(globalData,wmeColumn,wmes,"wme",(halfWidth - (colWidth * 2)), colWidth);
            // annotateWmes(wmeColumn,wmeNodeHeight);
            // var actionNodeHeight = drawGroup(globalData,actionColumn,actions,"action",(halfWidth + (colWidth)),colWidth);
            // annotateActions(actionColumn,actionNodeHeight);
            
        },
        /** cleanup */
        "cleanup" : function(globalData,values){
            d3.select("#wmeColumn").remove();
            d3.select("#actionColumn").remove();
        },
        /** compile */
        "compile" : function(globalData,values){
            console.log("Compiling Rete");
            globalData.shell.compileRete();
        },
        /** assert */
        "assert" : function(globalData,values){
            console.log("Asserting rete:",values);
            //assert the current node as a wme?
            globalData.shell.assertWMEs(values);
        },
        /** retract */
        "retract" : function(globalData,values){
            console.log("Retracting rete:",values);
            globalData.shell.retractWMEs(values);
        },
        /** ruleStep */
        "ruleStep" : function(globalData,values){
            console.log("Rete Time Step");
            globalData.shell.stepTime();
            //todo: draw the actions being performed this step

        },
        /** clearRete */
        "clearRete" : function(globalData,values){
            _.values(globalData.shell.allNodes).forEach(d=>d.setValue(undefined,"wmeId",undefined));
            globalData.shell.clearRete();

        },
        /** print Rete */
        "printRete" : function(globalData,values){
            console.log(globalData.shell.reteNet);
        },
        /** help */
        "help" : function(globalData,values){
            return {
                "assert": [ "", " Assert all nodes of tag.type.wme"],
                "compile" : [ "", " Compile all rules of tag.type.rule into the rete net"],
                "ruleStep" : [ "", "Increment the rete net time by one, performing scheduled assertions/retractions"],
                "clear" : [ "[complete]", " Clear wmes from the rete net, or reinit the net completely"],
                "printRete" : ["", "Print to console the retenet object for debugging"],
            };
        },
    };

    /** 
     Draw Group
     @function 
     @private
     */
    var drawGroup = function(globalData,domRoot,data,className,xLocation,groupWidth){
        console.log("Rete mode draw group:",data,xLocation,groupWidth);
        var amtOfSpace, heightOfNode,
            animationLength = 100;
        if(data.length > 0){
            amtOfSpace = (globalData.usableHeight - 100);
            heightOfNode = (amtOfSpace - (data.length * 20)) / data.length;
        }else{
            amtOfSpace = (globalData.usableHeight - 100);
            heightOfNode = amtOfSpace - 20;
        }

        var bound = domRoot.selectAll("."+className)
            .data(data,function(d,i){
                if(d.id) { return d.id; }
                return i;
            });

        bound.exit().remove();

        var enter = bound.enter().append("g")
            .classed(className, true);

        enter.append("rect")
            .attr("width",groupWidth)
            .attr("height",0)
            .attr("fill",globalData.colours.lightBlue);

        enter.append("text")
            .text("default");
        
        domRoot.selectAll("."+className)
            .attr("transform",function(d,i){
                return "translate("+xLocation + "," + (100 + (i * (heightOfNode + 20))) + ")";
            });

        domRoot.selectAll("rect")
            .transition()
            .attr("height",heightOfNode);

        domRoot.selectAll("text")
            .attr("transform","translate(10," + (heightOfNode * 0.4) + ")");

        return heightOfNode;
    };

    /** 
     annotateWMEs
     @function
     @private
     */
    var annotateWmes = function(domRoot,nodeHeight){
        domRoot.selectAll("text")
            .text(function(d){
                return "Wme: " + d.id;
            });

    };

    /**
     annotate actions
     @function
     @private
     */
    var annotateActions = function(domRoot,nodeHeight){
        domRoot.selectAll("text")
            .text(function(d){
                return "Action: " + d.action;
            });
    };
    
    return reteCommands;
});
