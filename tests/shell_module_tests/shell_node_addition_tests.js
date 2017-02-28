/**
   @file Tests to verify the shell

*/
"use strict";
let _ = require('lodash'),
    Shell = require('../../src/Shell'),
    getCtor = require('../../src/Node/Constructors'),
    makeShell = function(){return new Shell();},
    globalShell = makeShell();


exports.node_addition_tests = {

    initTest : function(test){
        let shell = makeShell();
        test.ok(shell.root !== undefined);
        test.ok(Object.keys(shell.allNodes).length === 1);
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
        let newNode = shell.addNode("test","child","GraphNode");
        //Post conditions:
        test.ok(_.keys(shell.allNodes).length === 2);
        test.ok(shell.allNodes[newNode.id].id === newNode.id);
        test.ok(shell.allNodes[newNode.id].name === "test");
        test.ok(shell.cwd.linkedNodes[newNode.id] !== undefined);
        test.ok(_.keys(shell.cwd.linkedNodes).length === 1);
        test.ok(newNode.linkedNodes[shell.root.id] = 'parent');
        test.ok(_.keys(newNode.linkedNodes).length === 1);
        test.ok(parseInt(_.keys(newNode.linkedNodes)[0]) === shell.cwd.id);
        test.done();
    },

    //create an anonymous node, one without a name
    add_anon_node : function(test){
        let newNode = globalShell.addNode(null,"child");
        test.ok(newNode.name === "anon");
        test.ok(globalShell.allNodes[newNode.id].id === newNode.id);
        test.done();
    },

    add_unrecognised_target : function(test){
        test.ok(globalShell.cwd.blah === undefined);
        test.doesNotThrow(function(){
            let newNode = globalShell.addNode("test","blah");
        });
        test.done();
    },

    add_as_parent : function(test){
        test.ok(_.keys(globalShell.cwd.linkedNodes.parents).length === 0);
        let newNode = globalShell.addNode("testParent","parent");
        test.ok(globalShell.cwd.linkedNodes[newNode.id] === 'parent');
        test.ok(globalShell.allNodes[newNode.id].id === newNode.id);
        test.done();
    },


    no_target_add : function(test){
        let shell = makeShell(),
            newNode = shell.addNode("test1");
        test.ok(newNode.name === "test1");
        test.ok(shell.root.linkedNodes[newNode.id] = "test1");
        test.done();
    },

    add_node_to_specific_existing_node : function(test){
        let shell = makeShell(),
            newNode1 = shell.addNode('test1'),
            newNode2 = shell.addNode('test2','child','parent','node',undefined,newNode1.id);
        test.ok(_.keys(shell.root.linkedNodes).length === 1,_.keys(shell.root.linkedNodes).length);
        test.ok(_.keys(newNode1.linkedNodes).length === 2);
        test.ok(_.keys(newNode2.linkedNodes).length === 1);
        test.ok(newNode1.linkedNodes[newNode2.id] === 'child');        
        test.done();
    },
    
    link_node_test : function(test){
        let shell = makeShell(),
            newNode1 = shell.addNode('test1'),
            newNode2 = shell.addNode('test2');
        test.ok(newNode1.linkedNodes[newNode2.id] === undefined);
        shell.addLink(newNode1,newNode2.id,'child');
        test.ok(newNode1.linkedNodes[newNode2.id] === 'child');
        test.done();
    },

    link_node_bad_id : function(test){
        let shell = makeShell(),
            newNode1 = shell.addNode('test1');
        test.throws(function(){
            shell.addLink(newNode1,'child','blah','awef');
        });
        test.throws(function(){
            shell.addLink(newNode,'awef',shell.root.id,'root');
        });
        test.done();
    },

    //todo: test subrelations object creation
    
};
