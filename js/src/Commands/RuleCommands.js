/**
   @file RuleCommands
   @purpose To implement all user commands dealing with rules
*/
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['./utils'],function(util){
    var ruleCommands = {
        //** @command cd
        "cd" : function(sh,values){
            util.valueCheck(values,1);
            sh.cd(values[0]);
        },
        //** @command new -> addCondition/test/action
        "new" : function(sh,values){
            if(values[0] === "condition"){
                sh.addCondition();
            }else if(values[0] === "action"){
                sh.addAction(values.slice(1));
            }else if(values[0] === "test"){
                sh.addTest(values[1],values[2],values[3],values[4]);
            }                
        },
        //** @command rm
        "rm" : function(sh,values){
            //remove action
            if(values[0] === 'action'){
                sh.removeAction(values.slice(1));
            }
            //condition
            if(values[0] === 'condition'){
                sh.removeCondition(values.slice(1));
            }                
            //test
            if(values[0] === 'test'){
                //condition number, test number
                sh.removeTest(values[1],values[2]);
            }
        },
        //** @command set
        //set action 0 actionType
        //set action 0 a #b
        //set action 0 a 5
        "set" : function(sh,values){
            //set actiontype
            if(values[0] === 'actionType' && !isNaN(Number(values[1]))){
                //set actionType 0 assert 
                sh.setActionValue(Number(values[1]),values[2]);
            }
            //action value
            if(values[0] === "actionValue"){
                sh.setActionValue(Number(values[1]),values[2],values[3]);
            }
            //action arithmetic
            //set arith 0 a + 6
            if(values[0] === 'arith'){
                sh.setArithmetic(values[1],values[2],values[3],values[4]);
            }                
            //set test value
            if(values[0] === 'test'){
                sh.setTest(values[1],values[2],values[3],values[4],values[5]);
            }                
            //binding
            if(values[0] === 'binding'){
                sh.setBinding(values[1],values[2],values[3]);
            }                
        },
        //** @command rename
        "rename" : function(sh,values){
            sh.rename(values[0]);
        },
    };

    
    return ruleCommands;

});
