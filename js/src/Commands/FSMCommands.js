/**
   @file FSMCommands
   @purpose defines the commands for the FSM mode
 */

define(['underscore'],function(_){

    var FSMCommands = {
        "draw" : function(globalData,values){

        },
        "cleanup" : function(globalData,values){

        },
        //add an event to the current node's events
        //values = [eventName,targetId]
        "event" : function(globalData,values){

        },
        //remove an event from the current node's events
        "rm" : function(globalData,values){

        },
        

    };

    return FSMCommands;
});
