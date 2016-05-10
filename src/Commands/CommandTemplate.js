define(['lodash'],function(_){
    "use strict";
    /**
     The interface that all Command modules implement
     @see module:globalData
     @interface
     @exports Commands/CommandTemplate
     */
    var CommandTemplate = {
        /** A simple command 
            @param {module:globalData} globalData
            @param values
         */
        "someCommand" : function(globalData,values){

        },
        /** draw 
            @param {module:globalData} globalData
            @param values
         */
        "draw" : function(globalData,values){

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
        }
    };

    return CommandTemplate;

});
