/**
   A test action that interfaces between the shell and retenet
 */
define([],function(){
    var AlertAction = {
        name : "alert",
        propose : function(token,reteNet){
            console.log("alerted");
            window.alert("blah");
            return {};
        },
        perform : function(proposedAction,reteNet){
            console.log("performed");

        }
    };

    return AlertAction;

});
