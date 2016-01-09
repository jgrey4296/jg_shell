
define(['underscore'],function(_){

    var SimulationCommands = {
        "draw" : function(globalData,values){

        },

        "cleanup" : function(globalData,values){

        },

        "runsim" : function(globalData,values){
            //get the number of turns:
            var turns = values.unshift();

            //compile the reteNet

            //assert starting facts

            //----
            //loop for the specified number of turns

            //update status for each character

            //get characters who can act

            //select actions from those available for each character

            //perform actions

            //assert new facts, retract old facts

            //-----
            //finish and summarise

        },
    };

    return SimulationCommands;
});
