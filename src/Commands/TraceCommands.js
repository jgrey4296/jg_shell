import _ from 'lodash';

    /**
     Triggering tracery style grammar expansions
     @exports Commands/TraceCommands
     @implements module:Commands/CommandTemplate
     */
    let TraceCommands = {
        /** draw
            @param globalData
            @param values
        */
        "draw" : function(globalData,values){
            // if (TraceDrawing.dummy === undefined){
            //     TraceDrawing.drawTraces(globalData,globalData.lastTraces);
            // }
        },
        /** cleanup
            @param globalData
            @param values
        */
        "cleanup" : function(globalData,values){
            ////TraceDrawing.cleanup();
        },
        /** Expand a trace of a node
            @param globalData
            @param {Array} values of [amt,nodeId]
        */
        "trace" : function(globalData,values){
            let amt = !isNaN(parseInt(values[0], 10)) ? Array(parseInt(values.shift(), 10)).fill(0) : [0],
                curNode = values[0] !== undefined ? globalData.shell.getNode(values[0]) : globalData.shell.cwd,
                returnVals = amt.map(()=>globalData.shell.traceNode(curNode));
            console.log("Trace Result:",returnVals);
            globalData.lastTraces = {
                id : curNode.id,
                name : curNode.name,
                values : returnVals
            };
        },
        /** Convert trace variables to children
            @param globalData
            @param values
        */
        "varsToChildren" : function(globalData,values){
            let curNode = globalData.shell.cwd,
                message = curNode.values.message || curNode.name,
                varRegex = /\${(\w+)}/g,
                matchResult = varRegex.exec(message),
                children = new Set(_.toPairs(curNode.linkedNodes).filter(d=>d[1].match(/^child/)).map(d=>this.getNode(d[1]).name));

            while (matchResult !== null){
                if (!children.has(matchResult[1])){
                    globalData.shell.addNode(matchResult[1],"child");
                }
                matchResult = varRegex.exec(message);
            }
        }
    };
export { TraceCommands };

