/**
   @file FSMCommands
   @purpose Defines how to interact with an FSM
 */

define(['underscore'],function(_){

    var FSMCommands = {
        "draw" : function(globalData,values){
            //draw central node


            //draw states

            //draw events/activities
            
        },
        "cleanup" : function(globalData,values){

        },
        //add an event to the current node's events
        //values = [eventName,targetId]
        "add" : function(globalData,values){
            var focus = values.shift();
            if(focus === "state"){
                var stateName = values.shift();
            }else if(focus === "event"){
                var from = values.shift();
                var to = values.shift();
                var name = values.shift();
                //globalData.shell.addNode(from,to,name);
            }
        },
        //remove an event from the current node's events
        "rm" : function(globalData,values){
            var focus = values.shift();
            if(focus === "state"){

            }else if(focus === "event"){

            }
        },
        

    };

    return FSMCommands;
});
