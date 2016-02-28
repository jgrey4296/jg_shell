define(['underscore'],function(_){
    "use strict";
    /**
     @interface
     @exports Commands/CommandTemplate
     */
    var CommandTemplate = {
        /** A simple command */
        "someCommand" : function(globalData,values){

        },
        /** draw */
        "draw" : function(globalData,values){

        },
        /** cleanup */
        "cleanup" : function(globalData,values){

        },
        /** Help */
        "help" : function(globalData,values){

        }
    };

    return CommandTemplate;

});
