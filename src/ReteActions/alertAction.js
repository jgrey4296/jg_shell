/**
   A test action that interfaces between the shell and retenet
 */
define([],function(){

    /**
       Creates the AlertAction proposal and performance functions, but with access to the passed in context object
       @constructor
       @param context
     */
    var AlertActionConstructor = function(context){
        var AlertAction = {
            name : "alert",//the name registered under
            propose : function(token,reteNet){
                //create the data object:
                var newWMEData = reteNet.utils.createNewWMEData(this,token);
                reteNet.utils.applyArithmetic(this,newWMEData);
                reteNet.utils.applyRegex(this,newWMEData);
                //Expand out to object structure
                //ie: {values.a:5, tags.type: rule} -> {values:{a:5},tags:{type:rule}}
                var complexFormData = reteNet.utils.objDescToObject(newWMEData);
                
                //To be returned to activateActionNode
                var proposedAction = new reteNet.ProposedAction(reteNet,"alert", complexFormData, token,
                                                                reteNet.currentTime,
                                                                this.timing,
                                                                this.priority
                                                               );
                
                return proposedAction;        
                
            },
            perform : function(proposedAction,reteNet){
                context.shell.reteOutput.push(proposedAction.payload.message);
                
            }
        };
        return AlertAction;
    };

    return AlertActionConstructor;

});
