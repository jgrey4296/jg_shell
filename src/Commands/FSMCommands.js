/* jshint esversion : 6 */
define(['underscore','Drawing/FSMDrawing'],function(_,FSMDrawing){
    "use strict";
    /**
     The interface for FSM modification
     @see module:globalData
     @interface
     @exports Commands/FSMCommandTemplate
     */
    var FSMCommandTemplate = {
        /** draw 
            @param {module:globalData} globalData
            @param values
         */
        "draw" : function(globalData,values){
            let cwdType = globalData.shell.cwd.tags.type;
            if(cwdType === 'fsm'){
                FSMDrawing.drawFSM(globalData,globalData.shell.cwd);
            }else if(cwdType === 'event'){
                FSMDrawing.drawEvent(globalData,globalData.shell.cwd);
            }else if(cwdType === 'state'){
                FSMDrawing.drawState(globalData,globalData.shell.cwd);
            }else{
                throw new Error("FSM Draw: Unrecognised FSM node type");
            }
        },
        /** cleanup 
            @param {module:globalData} globalData
            @param values
        */
        "cleanup" : function(globalData,values){
            if(FSMDrawing.dummy === undefined){
                FSMDrawing.cleanup();
            }
        },
        /** Help - For drawing to the gui help information
            @param {module:globalData} globalData
            @param values
        */
        "help" : function(globalData,values){
            return {
                "new" : ["state|event $name"," Create a new component of the fsm"],
                "rm" : ["$id", "Remove the specified state or event from the fsm, cleaning up associated links"],
                "link" : ["$sourceId $eventId $sinkId", "Plug a state to another state via an event"],
                "unlink" : ["$sourceId $eventId $sinkId", "Remove a state to state linkage via the specified event"],
            };
        },
        /**
           Remove an event or state from the fsm
         */
        "rm" : function(globalData,values){

        },
        //add, or link, a new state
        "new" : function(globalData,values){
            let type = values.shift(),
                name = values.shift(),
                target = values.shift();
            if(type === undefined || name === undefined || (type !== 'state' && type !== 'event')){
                throw new Error("New Specification incorrect");
            }
            globalData.shell.addFSMComponent(type,name,target);
            
        },
        //specify state => link => state link of the current fsm
        //create the event if it doesnt exist?
        "link" : function(globalData,values){
            let sourceId = values.shift(),
                eventId = values.shift(),
                sinkId = values.shift();

            if(sourceId && eventId && sinkId){
                globalData.shell.addFSMLink(sourceId,eventId,sinkId);
            }else{
                throw new Error("Invalid FSM Link format");
            }
        },
        /**
           unlink an event from its source and sink
        */
        "unlink" : function(globalData,values){

        },
    };

    return FSMCommandTemplate;

});
