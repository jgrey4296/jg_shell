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
            FSMDrawing.cleanup();
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
            let component = values.shift();
            globalData.shell.rmFSMComponent(component);
        },
        //add, or link, a new state
        "new" : function(globalData,values){
            let type = values.shift(),
                names = values.slice(0);
            if(type === undefined || names.length === 0 || (type !== 'state' && type !== 'event')){
                throw new Error("New Specification incorrect");
            }
            globalData.shell.addFSMComponent(type,names);
            
        },
        //specify state => link => state link of the current fsm
        //create the event if it doesnt exist?
        "link" : function(globalData,values){
            let sourceId = values.shift(),
                eventId = values.shift(),
                sinkId = values.shift();

            if(sourceId && eventId){
                globalData.shell.addFSMLink(sourceId,eventId,sinkId);
            }else{
                throw new Error("Invalid FSM Link format");
            }
        },
        /**
           unlink an event from its source and sink
        */
        "unlink" : function(globalData,values){
            let source = values.shift(),
                event = values.shift(),
                sink = values.shift();
            globalData.shell.removeFSMLink(source,event,sink);
        },
        /**
           propose: display states in the left search bar,
           events in the right inspection bar
        */
        "propose" : function(globalData,values){
            let statesAndEvents = globalData.shell.getComponentsForCurrentFSM();

            //console.log("Proposing:",statesAndEvents);
            
            //for the left data bar
            globalData.lastSetOfSearchResults = statesAndEvents.states;
            globalData.lastInspectData = statesAndEvents.events;
        },
        //for dev of fsm runtime:
        "set" : function(globalData,values){
            if(globalData.shell.cwd.tags.type !== 'fsm'){
                throw new Error('not an fsm to set');
            }
            globalData.shell.setFSMForInd(values.shift(),values.shift(),undefined,globalData.shell.cwd.id);
        },
        "trigger" : function(globalData,values){
            if(globalData.shell.cwd.tags.type !== 'fsm'){
                throw new Error('not an fsm to trigger');
            }
            globalData.shell.triggerEvent(values.shift(),values.shift(),globalData.shell.cwd.id);        },

        
    };

    return FSMCommandTemplate;

});
