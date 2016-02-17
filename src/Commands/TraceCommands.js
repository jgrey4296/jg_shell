
define(['underscore'],function(_){
    "use strict";
    
    var TraceCommands = {
        "draw" : function(globalData,values){

        },

        "cleanup" : function(globalData,values){

        },
        "trace" : function(globalData,values){
            var curNode = globalData.shell.cwd;
            var returnVal = globalData.shell.traceNode(curNode);
            console.log("Trace Result:",returnVal);
        },
        "varsToChildren" : function(globalData,values){
            var curNode = globalData.shell.cwd,
                message = curNode.values.message || curNode.name,
                vars = message.match(/\$\w+/g);

            vars.forEach(function(d){
                var varName = d.slice(1);
                if(!_.contains(_.values(curNode.children),varName)){
                    globalData.shell.addNode(varName,"children");
                }                
            });
            

        },
    };

    return TraceCommands;

});
