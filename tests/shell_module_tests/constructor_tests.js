/**
   @file Tests to verify the shell

 */
var _ = require('underscore'),
    Shell = require('../../src/Shell'),
    makeShell = function(){return new Shell();},
    globalShell = makeShell();


exports.ShellTests = {

    initTest : function(test){
        var shell = makeShell();
        test.ok(shell.root !== undefined);
        test.ok(_.keys(shell.allNodes).length === 1);
        test.ok(shell.allRules.length === 0);
        test.ok(Object.keys(shell.allRulesByName).length === 0);
        test.ok(shell.cwd.id === shell.root.id);
        test.done();
    },

    //create a node, check it is added into the shell correctly
    add_single_node : function(test){
        var shell = makeShell();
        //Pre conditions:
        test.ok(_.keys(shell.allNodes).length === 1);
        test.ok(_.keys(shell.cwd.linkedNodes.children).length === 0);
        //Action:
        var newNode = shell.addNode("test","children","GraphNode");
        //Post conditions:
        test.ok(_.keys(shell.allNodes).length === 2);
        test.ok(shell.allNodes[newNode.id].id === newNode.id);
        test.ok(shell.allNodes[newNode.id].name === "test");
        test.ok(shell.cwd.linkedNodes.children[newNode.id] !== undefined);
        test.ok(_.keys(shell.cwd.linkedNodes.children).length === 1);
        
        test.done();
    },

    add_anon_node : function(test){
        var newNode = globalShell.addNode(null,"children");
        test.ok(newNode.name === "anon");
        test.ok(globalShell.allNodes[newNode.id].id === newNode.id);
        test.done();
    },

    add_to_unrecognised_target : function(test){
        test.ok(globalShell.cwd.blah === undefined);
        test.throws(function(){
            var newNode = globalShell.addNode("test","blah");
        });
        test.done();
    },

    add_as_parent : function(test){
        test.ok(_.keys(globalShell.cwd.linkedNodes.parents).length === 0);
        var newNode = globalShell.addNode("testParent","parents");
        test.ok(globalShell.cwd.linkedNodes.parents[newNode.id] === newNode.name);
        test.ok(globalShell.allNodes[newNode.id].id === newNode.id);
        test.done();
    },

    //add node with existing id

    
    
    
};
