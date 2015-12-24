/**
   @file ActivityCommands
   @purpose Defines how to interact with an activity
*/

define(['underscore'],function(_){

    var ActivityCommands = {

        "draw" : function(globalData,values){

        },
        "cleanup" : function(globalData, values){


        },
        "add" : function(globalData,values){
            var focus = values.shift();
            if(focus === "rule"){

            }else if(focus === "tool"){

            }
        }


    };

    return ActivityCommands;


});
