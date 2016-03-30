define(['underscore','Drawing/FSMDrawing'],function(_,FSMDrawing){
    "use strict";
    /**
     The interface for FSM modification
     @see module:globalData
     @interface
     @exports Commands/CommandTemplate
     */
    var CommandTemplate = {
        /** draw 
            @param {module:globalData} globalData
            @param values
         */
        "draw" : function(globalData,values){
            let cwdType = globalData.shell.cwd.tags.type;
            if(cwdType === 'fsm'){
                FSMDrawing.drawFSM(globalData,globalData.shell.cwd);
            }else if(cwdType === 'event'){
                //FSMDrawing.drawEvent(globalData,globalData.shell.cwd);
            }else if(cwdType === 'state'){
                //FSMDrawing.drawEvent(globalData,globalData.shell.cwd);
            }else{
                throw new Error("FSM Draw: Unrecognised FSM node type");
            }
        },
        /** cleanup 
            @param {module:globalData} globalData
            @param values
        */
        "cleanup" : function(globalData,values){

        },
        /** Help - For drawing to the gui help information
            @param {module:globalData} globalData
            @param values
        */
        "help" : function(globalData,values){
            return {
                "someCommand" : ["Param Strings","Description" ]
            };
        },
        "rm" : function(globalData,values){

        },
        //add, or link, a new state
        "state" : function(globalData,values){

        },
        //add, or link, a new event
        "event" : function(globalData,values){

        },
        "help" : function(globalData,values){
            

        },
    };

    return CommandTemplate;

});