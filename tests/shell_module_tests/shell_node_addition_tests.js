/**
   @file Tests to verify the shell

*/
"use strict";
var _ = require('underscore'),
    Shell = require('../../src/Shell'),
    makeShell = function(){return new Shell();},
    globalShell = makeShell();


exports.ShellTests = {

    initTest : function(test){
        var shell = makeShell();
        test.ok(shell.root !== undefined);
        test.ok(Object.keys(shell.allNodes).length === 1);
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
        test.ok(newNode.linkedNodes._originalParent === shell.root.id);
        test.ok(_.keys(newNode.linkedNodes.parents).length === 1);
        test.ok(parseInt(_.keys(newNode.linkedNodes.parents)[0]) === shell.cwd.id);
        test.done();
    },

    //create an anonymous node, one without a name
    add_anon_node : function(test){
        let newNode = globalShell.addNode(null,"children");
        test.ok(newNode.name === "anon");
        test.ok(globalShell.allNodes[newNode.id].id === newNode.id);
        test.done();
    },

    add_unrecognised_target : function(test){
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


    no_target_add : function(test){
        let shell = makeShell(),
            newNode = shell.addNode("test1");
        test.ok(newNode.name === "test1");
        test.ok(shell.root.linkedNodes.children[newNode.id] = "test1");
        test.done();
    },

    add_node_to_specific_existing_node : function(test){
        let shell = makeShell(),
            newNode1 = shell.addNode('test1'),
            newNode2 = shell.addNode('test2',undefined,undefined,undefined,newNode1.id);
        test.ok(_.keys(shell.root.linkedNodes.children).length === 1);
        test.ok(_.keys(newNode1.linkedNodes.children).length === 1);
        test.ok(_.keys(newNode2.linkedNodes.children).length === 0);
        test.ok(newNode1.linkedNodes.children[newNode2.id] = newNode2.name);        
        test.done();
    },
    
    link_node_test : function(test){
        let shell = makeShell(),
            newNode1 = shell.addNode('test1'),
            newNode2 = shell.addNode('test2');
        test.ok(newNode1.linkedNodes.children[newNode2.id] === undefined);
        shell.addLink(newNode1,'children',newNode2.id,newNode2.name);
        test.ok(newNode1.linkedNodes.children[newNode2.id] === newNode2.name);
        test.done();
    },

    
    
    
};
