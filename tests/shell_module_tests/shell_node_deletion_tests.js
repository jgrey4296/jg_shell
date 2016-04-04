/**
   @file Tests to verify the shell

*/
"use strict";
let _ = require('underscore'),
    Shell = require('../../src/Shell'),
    makeShell = function(){return new Shell();};


exports.node_deletion_tests = {

    initTest : function(test){
        let shell = makeShell();
        test.ok(shell.root !== undefined);
        test.ok(Object.keys(shell.allNodes).length === 1);
        test.ok(shell.allRules.length === 0);
        test.ok(Object.keys(shell.allRulesByName).length === 0);
        test.ok(shell.cwd.id === shell.root.id);
        test.done();
    },

    //remove numeric id
    removeNumericIdLink_test : function(test){
        let shell = makeShell(),
            newNode1 = shell.addNode('test');
        test.ok(newNode1.linkedNodes[shell.root.id] === 'parent');
        test.ok(shell.root.linkedNodes[newNode1.id] === 'child');
        shell.removeNumericIdLink(newNode1.id,shell.root);
        test.ok(_.keys(shell.root.linkedNodes).length === 0);
        test.ok(_.keys(newNode1.linkedNodes).length === 0);            
        test.done();
    },

    misuse_removeNumericIdLink_test : function(test){
        let shell = makeShell(),
            newNode1 = shell.addNode('test');
        test.throws(function(){
            shell.removeNumericIdLink('awf',shell.root);
        });
        test.done();
    },
    
    
    //rm node - remove the node from a specified node

    //delete node - remove node from all related nodes, allNodes, and remove
    //all dependent nodes

    //cleanup node

    //remove action

    //remove condition

    //remove test

    //remove binding

    

    
};
