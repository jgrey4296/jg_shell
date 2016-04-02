/**
   @file Tests to verify the shell

 */
var _ = require('underscore'),
    Shell = require('../../src/Shell'),
    makeShell = function(){return new Shell();};


exports.ShellTests = {

    initTest : function(test){
        var shell = makeShell();
        test.ok(shell.root !== undefined);
        test.ok(Object.keys(shell.allNodes).length === 1);
        test.ok(shell.allRules.length === 0);
        test.ok(Object.keys(shell.allRulesByName).length === 0);
        test.ok(shell.cwd.id === shell.root.id);
        test.done();
    }

};
