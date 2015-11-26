/**
   @file NodeCommands
   @purpose to define the user actions that can be performed on a typical node in the shell
*/

var imports = ["utils"];
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
    imports = imports.map(function(d){
        return "./"+d;
    });
}else{
    imports = imports.map(function(d){
        return "./"+d;
    });
}

define(imports,function(util){
    //All of the commands for the normal node mode of the shell
    var nodeCommands = {
        //new -> addNode,
        "new" : function(sh,values){
            util.valueCheck(values,3,values);
            //Expand out simplifications
            console.log("new",values);
            var target = values[0];
            if(target === "child") target = "children";
            if(target === "parent") target  = "parents";
            console.log("Target:",target);
            sh.addNode(values[2],target,values[1]);
        },
        //node creation Shortcuts:
        "nc" : function(sh,values){
            var chars = {
                "n" : "node",
                "i" : "institution",
                "r" : "role",
                "a" : "activity",
                "rc": "rulecontainer",
            };
            if(chars[values[0]]){
                sh.addNode(values[1],'children',chars[values[0]]);
            }
        },
        "np" : function(sh,values){
            var chars = {
                "n" : "node",
                "i" : "institution",
                "r" : "role",
                "a" : "activity",
                "rc": "rulecontainer",
            };
            if(chars[values[0]]){
                sh.addNode(values[1],'parents',chars[values[0]]);
            }
        },
        //New Child Node, ncn:
        "ncn" : function(sh,values){
            sh.addNode(values[0],'children','node');
        },
        //new child institution: nci
        "nci" : function(sh,values){
            sh.addNode(values[0],'children','institution');
        },
        //------------------------------
        //rm -> removeNode,
        "rm" : function(sh,values){
            sh.rm(values[0]);
        },
        //cd -> cd
        "cd" : function(sh,values){
            util.valueCheck(values,1);
            sh.cd(values[0]);
        },
        //set -> setParameter
        "set" : function(sh,values){
            sh.setParameter(values[0],values[1],values[2]);
        },
        //link -> link
        //TODO: detect if recursive connection or not
        "link" : function(sh,values){
            var target = values[0];
            if(target === 'child') target = 'children';
            if(target === 'parent') target = 'parents';
            sh.link(target,values[1],false);
        },
        "linkr" : function(sh,values){
            var target = values[0];
            if(target === 'child') target = 'children';
            if(target === 'parent') target = 'parents';
            sh.link(target,values[1],true);

        },
        //rename -> rename
        "rename" : function(sh,values){
            sh.rename(values[0]);
        },
        //Stashing:
        "stash" : function(sh,values){
            sh.stash();
        },
        "unstash" : function(sh,values){
            sh.unstash();
        },
        "top" : function(sh,values){
            sh.top();
        },
        "prev" : function(sh,values){
            sh.cd(sh.previousLocation);
        },
        //Search:
        "search" : function(sh,values){
            var returnedData = sh.search(values[0],values[1],values[2]);
        }            
    };

    return nodeCommands;
});


        
//     //Get conditionless rules
//     //get actionless rules
//     //get testless conditions
//     //get ruleless conditions

//     //Get the next and previous rules by id
//     "next" : function(sh,values){
//         sh.moveTo(sh.cwd + 1);
//     },
//     "prev" : function(sh,values){
//         sh.moveTo(sh.cwd - 1);
//     },
