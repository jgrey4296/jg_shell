/**
   @file Tests to verify the shell

*/
"use strict";
let _ = require('underscore'),
    Shell = require('../../src/Shell'),
    makeShell = function(){return new Shell();},
    globalShell = makeShell();


exports.ShellTests = {

    initTest : function(test){
        let shell = makeShell();
        test.ok(shell.root !== undefined);
        test.ok(_.keys(shell.allNodes).length === 1);
        test.ok(shell.allRules.length === 0);
        test.ok(Object.keys(shell.allRulesByName).length === 0);
        test.ok(shell.cwd.id === shell.root.id);
        test.done();
    },

    //create a node, check it is added into the shell correctly
    add_single_node : function(test){
        let shell = makeShell();
        //Pre conditions:
        test.ok(_.keys(shell.allNodes).length === 1);
        test.ok(_.keys(shell.cwd.linkedNodes).length === 0);
        //Action:
        let newNode = shell.addNode("test","children","GraphNode");
        //Post conditions:
        test.ok(_.keys(shell.allNodes).length === 2);
        test.ok(shell.allNodes[newNode.id].id === newNode.id);
        test.ok(shell.allNodes[newNode.id].name === "test");
        test.ok(shell.cwd.linkedNodes[newNode.id] !== undefined);
        test.ok(_.keys(shell.cwd.linkedNodes).length === 1);
        
        test.done();
    },

    add_anon_node : function(test){
        let newNode = globalShell.addNode(null,"children");
        test.ok(newNode.name === "anon");
        test.ok(globalShell.allNodes[newNode.id].id === newNode.id);
        test.done();
    },

    add_as_parent : function(test){
        test.ok(_.keys(globalShell.cwd.linkedNodes).length === 1,_.keys(globalShell.cwd.linkedNodes).length);
        let newNode = globalShell.addNode("testParent","parent");
        test.ok(globalShell.cwd.linkedNodes[newNode.id] === 'parent',globalShell.cwd.linkedNodes[newNode.id]);
        test.ok(globalShell.allNodes[newNode.id].id === newNode.id);
        test.done();
    },

    
};
