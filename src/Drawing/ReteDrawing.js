/* jshint esversion : 6 */
define(['underscore','d3','utils','./DrawUtils'],function(_,d3,util,DrawUtils){

    /** The interface for drawing elements from the retenet
        @exports Drawing/ReteDrawing
     */
    var ReteDrawInterface = {};

    /** Draw the proposed actions
        @function
        @param globalData
        @param {Array.<ProposedAction>} data
     */
    ReteDrawInterface.drawProposed = function(globalData,data){
        //Add the title:
        data = [{title:"Proposed"}].concat(data);
        //Standard details:
        let commonData = new DrawUtils.CommonData(globalData,data,2);
        commonData.nodeDataSeparator = 10;
        commonData.groupDataSeparator = 10;
        commonData.widthAddition = 10;

        //create the main container
        let mainContainer = DrawUtils.createOrShare("mainContainer"),
        //create the proposed column
            proposed = DrawUtils.createOrShare("proposed",mainContainer)
            .attr("transform",`translate(${commonData.halfWidth - commonData.colWidth},100)`);
        
        //draw the proposed column
        DrawUtils.drawGroup(proposed,commonData,function(d){
            if(d.title !== undefined){
                return [{name: d.title}];
            }
            //else:
            return [{
                name : `(${d.id}): ${d.actionType}`,
                values : _.pairs(d.payload).map(function(d){
                    if(d[0] === 'bindings'){
                        return d[0] + JSON.stringify(d[1]).replace(",",", ");
                    }
                    return d.join(": ");
                })
            }];
        });
    };

        
    /** Draw the scheduled actions
        @function
        @param globalData
        @param {Array.<ProposedAction>} data
     */
    ReteDrawInterface.drawSchedule = function(globalData,data){
        //add the title:
        data = [{title:"Scheduled"}].concat(data);
        console.log("scheduled data:",data);
        let commonData = new DrawUtils.CommonData(globalData,data,2);
        commonData.nodeDataSeparator = 10;
        commonData.groupDataSeparator = 10;
        commonData.widthAddition = 10;

        //main container
        let mainContainer = DrawUtils.createOrShare("mainContainer"),
        //create the schedule column
            scheduled = DrawUtils.createOrShare("scheduled",mainContainer)
            .attr("transform",`translate(${commonData.halfWidth + commonData.colWidth},100)`);
        
        //draw the column
        DrawUtils.drawGroup(scheduled,commonData,function(d){
            if(d.title !== undefined){
                return [{name:d.title}];
            }
            //else
            return [{
                name : `(${d.id}): ${d.actionType}`,
                values : _.pairs(d.payload).map(function(d){
                    if(d[0] === 'bindings'){
                        return d[0] + JSON.stringify(d[1]);
                    }
                    return d.join(": ");
                })
            }];
        });
    };

    
    /** Draw the saved log of rete actions
        @function
        @param globalData
        @param {Array.<String>} data
     */
    ReteDrawInterface.drawLog = function(globalData,data){
        //add the title:
        data = ["Rete Output Log:"].concat(data);
        console.log("data:",data);
        let commonData = new DrawUtils.CommonData(globalData,data,1);
        commonData.nodeDataSeparator = 10;
        commonData.groupDataSeparator = 10;
        commonData.widthAddition = 10;

        //main container
        let mainContainer = DrawUtils.createOrShare("mainContainer"),
        //create the log column
            reteLog = DrawUtils.createOrShare("reteLog",mainContainer)
            .attr("transform",`translate(${commonData.halfWidth},100)`);
        //draw the column
        DrawUtils.drawGroup(reteLog,commonData,d=>([{name: d}]));
    };

    /**
       Remove anything that DrawRete creates
       @function
    */
    ReteDrawInterface.cleanup = DrawUtils.cleanup.bind({},"#proposed","#scheduled","#reteLog");

    
    
    return ReteDrawInterface;
});
