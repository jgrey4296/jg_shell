/**
   @file Tests to verify the shell

 */
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

var _ = require('underscore'),
    TotalShell = require('../../src/TotalShell'),
    makeShell = function(){return new TotalShell.CompleteShell();};


exports.TotalShellTests = {

    initTest : function(test){
        var shell = makeShell();
        test.ok(shell.root !== undefined);
        test.ok(Object.keys(shell.allNodes).length === 3);
        test.ok(shell.allRules.length === 0);
        test.ok(Object.keys(shell.allRulesByName).length === 0);
        test.ok(shell.cwd.id === shell.root.id);
        test.done();
    }

    test_getNodeListByIds : function(test){

    },

    test_nodeToShortString : function(test){

    },

    test_nodeToStringList : function(test){

    },

    test_ruleToStringList : function(test){

    },

    test_getListsFromNode : function(test){

    },

    test_getListFromNode : function(test){


    },

    test_pwd : function(test){

    }
    
};
