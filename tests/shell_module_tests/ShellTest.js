/**
   @file Tests to verify the shell

*/
"use strict";
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
    },

    createNodeTest : function(test){
        var shell = makeShell();
        var newNode = shell.addNode("test",'children');
        test.ok(shell.cwd.linkedNodes.children[newNode.id] !== undefined);
        test.ok(shell.cwd.linkedNodes.children[newNode.id] === newNode.name);
        test.ok(shell.allNodes[newNode.id].name === newNode.name);
        test.done();
    },

    createMultipleNodes : function(test){
        var shell = makeShell();
        var n1 = shell.addNode("test1",'children');
        var n2 = shell.addNode('test2','children');
        test.ok(n1.id !== n2.id);
        test.ok(Object.keys(shell.cwd.linkedNodes.children).length === 2);
        test.done();
    },

    createParentNode : function(test){
        var shell = makeShell();
        var parentNode = shell.addNode('test1','parents');
        test.ok(parentNode !== undefined);
        test.ok(Object.keys(shell.cwd.linkedNodes.parents).length === 1);
        test.ok(shell.cwd._originalParent === undefined);
        test.ok(shell.cwd.linkedNodes.parents[parentNode.id] === parentNode.name);
        test.ok(parentNode.linkedNodes.children[shell.cwd.id] === shell.cwd.name);
        test.done();
    },

    changeDirTest : function(test){
        var shell = makeShell();
        var child = shell.addNode('test1','children');
        test.ok(Object.keys(shell.cwd.linkedNodes.children).length === 1);
        shell.cd(child.id);
        test.ok(shell.cwd.id === child.id);
        shell.cd(shell.root.id);
        test.ok(shell.cwd.id === shell.root.id);
        shell.cd(child.id);
        test.ok(shell.cwd.id === child.id);
        test.done();
    },

    changeDirByNameTest : function(test){
        var shell = makeShell();
        var child = shell.addNode('test1','children');
        test.ok(shell.root.id === shell.cwd.id);
        shell.cd('test1');
        test.ok(shell.cwd.id === child.id);        
        test.done();
    },
    
    addTypesOfNodeTest : function(test){
        var shell = makeShell();
        var child1 = shell.addNode('test1','children','role');
        test.ok(child1.tags.type === "role");
        test.ok(child1.linkedNodes._originalParent === shell.cwd.id)

        var child2 = shell.addNode('test2','children','institution');
        test.ok(child2.tags.type === "institution",child2.tags.type);
        test.ok(child2.linkedNodes._originalParent === shell.cwd.id);
        test.done();        
    },

    checkInstitutionConstructionTest : function(test){
        let shell = makeShell(),
        newNode = shell.addNode('test1','children','institution');
        test.ok(newNode.tags.type === 'institution');
        test.ok(_.keys(newNode.linkedNodes.children).length === 6,_.keys(newNode.linkedNodes.children).length);
        test.ok(_.keys(newNode.linkedNodes.parents).length === 2); 
        test.done();
    },

    checkRuleConstructionTest : function(test){
        var shell = makeShell();
        var newRule = shell.addNode('test1','children','rule');
        shell.cd('test1');
        test.ok(shell.cwd.tags.type === "rule");
        test.ok(shell.cwd.id === newRule.id);
        test.ok(newRule.tags.type === 'rule');
        test.ok(newRule.name === 'test1');
        test.ok(_.keys(newRule.actions).length === 0);
        test.ok(_.values(newRule.conditions).length === 0);
        test.done();
    },

    getNodeListByIdsTest : function(test){
        var shell = makeShell();
        var nodes = [];
        nodes.push(shell.addNode('test1','children'));
        nodes.push(shell.addNode('test2','children'));
        shell.cd(nodes[1].id);
        nodes.push(shell.addNode('test3','children'));
        nodes.push(shell.addNode('test4','children'));
        nodes.push(shell.addNode('test5','children'));
        nodes.push(shell.addNode('test6','children'));

        var ids = nodes.map(function(d){
            return d.id;
        });
        var retrievedNodes = shell.getNodeListByIds(ids);
        //check every id and node align
        var combinedLists = _.zip(ids,retrievedNodes);
        combinedLists.forEach(function(d){
            test.ok(d[0] === d[1].id);
        });
        test.done();
    },

    setParameterTest : function(test){
        var shell = makeShell();
        //test values
        shell.setParameter('values','blah',5);
        test.ok(shell.cwd.values.blah === 5);
        shell.setParameter('values','blah');
        test.ok(shell.cwd.values.blah === undefined);
        //test tags:
        shell.setParameter('tags','blah',true);
        test.ok(shell.cwd.tags.blah === true);
        shell.setParameter('tags','blah');
        test.ok(shell.cwd.tags.blah === undefined);
        //test annotations:
        shell.setParameter('annotations','blah',5);
        test.ok(shell.cwd.annotations.blah === 5);
        shell.setParameter('annotations','blah');
        test.ok(shell.cwd.annotations.blah === undefined);
        //test other:
                
        test.done();
    },

    linkTest : function(test){
        var shell = makeShell();
        var newNode = shell.addNode('test1','children');
        var node2 = shell.addNode('test2','children');
        shell.cd(newNode.id);
        var thirdNode = shell.addNode('test3','children');
        shell.cd(node2.id);

        test.ok(thirdNode.linkedNodes._originalParent === newNode.id);
        test.ok(shell.cwd.id === node2.id);

        shell.link('parents',thirdNode.id);
        test.ok(shell.cwd.linkedNodes.parents[thirdNode.id] === thirdNode.name);
        test.ok(shell.allNodes[thirdNode.id].name === thirdNode.name);
        test.done();
    },

    rmTest : function(test){
        var shell = makeShell();
        var newNode = shell.addNode('test1','children');
        test.ok(shell.cwd.linkedNodes.children[newNode.id] !== undefined);
        test.ok(shell.cwd.linkedNodes.children[newNode.id] === newNode.name);
        shell.rm(newNode.id);
        test.ok(shell.cwd.linkedNodes.children[newNode.id] === undefined);
        
        test.done();
    },

    renameTest : function(test){
        var shell = makeShell();
        test.ok(shell.cwd.name === "__root");
        test.ok(shell.cwd.id === shell.root.id);
        shell.rename("bob");
        test.ok(shell.cwd.name === "bob");
        test.ok(shell.root.name === "bob");
        test.done();
    },


    importJsonTest : function(test){
        var test1Data = require('../testData/test1.json');
        var shell = makeShell();
        test.ok(_.keys(shell.allNodes).length === 1);
        shell.importJson(test1Data);
        test.ok(_.keys(shell.allNodes).length === 7,_.keys(shell.allNodes));
        
        test.done();
    },

};
