/**
   @file Tests to verify the shell

*/
"use strict";
var _ = require('underscore'),
    Shell = require('../../src/Shell'),
    makeShell = function(){return new Shell();};


exports.ShellTests = {

    initTest : function(test){
        let shell = makeShell();
        test.ok(shell.root !== undefined);
        test.ok(_.keys(shell.allNodes).length === 1);
        test.ok(shell.allRules.length === 0);
        test.ok(_.keys(shell.allRulesByName).length === 0);
        test.ok(shell.cwd.id === shell.root.id);
        test.done();
    },

    createNodeTest : function(test){
        let shell = makeShell(),
            newNode = shell.addNode("test",'child');
        test.ok(shell.cwd.linkedNodes[newNode.id] === 'child');
        test.ok(shell.allNodes[newNode.id].name === newNode.name);
        test.done();
    },

    createMultipleNodes : function(test){
        let shell = makeShell();
        test.ok(_.keys(shell.cwd.linkedNodes).length === 0);
        let n1 = shell.addNode("test1",'child'),
            n2 = shell.addNode('test2','child');
        test.ok(n1.id !== n2.id);
        test.ok(_.keys(shell.cwd.linkedNodes).length === 2);
        test.done();
    },

    createParentNode : function(test){
        let shell = makeShell(),
            parentNode = shell.addNode('test1','parent','child');
        test.ok(parentNode !== undefined);
        test.ok(_.pairs(shell.cwd.linkedNodes).filter(d=>/parent/.test(d[1])).length === 1);
        test.ok(shell.cwd.linkedNodes[parentNode.id] === 'parent');
        test.ok(parentNode.linkedNodes[shell.cwd.id] === 'child');
        test.done();
    },

    changeDirTest : function(test){
        let shell = makeShell(),
            child = shell.addNode('test1','child');
        test.ok(_.pairs(shell.cwd.linkedNodes).filter(d=>/child/.test(d[1])).length === 1);
        shell.cd(child.id);
        test.ok(shell.cwd.id === child.id);
        shell.cd(shell.root.id);
        test.ok(shell.cwd.id === shell.root.id);
        shell.cd(child.id);
        test.ok(shell.cwd.id === child.id);
        test.done();
    },

    changeDirByNameTest : function(test){
        let shell = makeShell(),
            child = shell.addNode('test1','child');
        test.ok(shell.root.id === shell.cwd.id);
        shell.cd('test1');
        test.ok(shell.cwd.id === child.id);        
        test.done();
    },
    
    addTypesOfNodeTest : function(test){
        let shell = makeShell(),
            child1 = shell.addNode('test1','child','parent','role');
        test.ok(child1.tags.type === "role");
        test.ok(parseInt(_.find(_.pairs(child1.linkedNodes),d=>/parent/.test(d[1]))[0]) === shell.cwd.id)

        let child2 = shell.addNode('test2','child','parent','institution');
        test.ok(child2.tags.type === "institution",child2.tags.type);
        test.ok(child2.linkedNodes[shell.cwd.id] === 'parent');
        test.done();        
    },

    checkInstitutionConstructionTest : function(test){
        let shell = makeShell(),
            newNode = shell.addNode('test1','child','parent','institution');
        test.ok(newNode.tags.type === 'institution');
        //7 extras + parent:
        test.ok(_.keys(newNode.linkedNodes).length === 8,_.keys(newNode.linkedNodes).length);
        test.done();
    },

    checkRuleConstructionTest : function(test){
        let shell = makeShell(),
            newRule = shell.addNode('test1','child','parent','rule');
        shell.cd('test1');
        test.ok(shell.cwd.tags.type === "rule");
        test.ok(shell.cwd.id === newRule.id);
        test.ok(newRule.tags.type === 'rule');
        test.ok(newRule.name === 'test1');
        test.done();
    },

    getNodeListByIdsTest : function(test){
        let shell = makeShell(),
            nodes = [];
        nodes.push(shell.addNode('test1','child'));
        nodes.push(shell.addNode('test2','child'));
        shell.cd(nodes[1].id);
        nodes.push(shell.addNode('test3','child'));
        nodes.push(shell.addNode('test4','child'));
        nodes.push(shell.addNode('test5','child'));
        nodes.push(shell.addNode('test6','child'));

        let ids = nodes.map(function(d){
            return d.id;
        }),
            retrievedNodes = shell.getNodeListByIds(ids),
        //check every id and node align
            combinedLists = _.zip(ids,retrievedNodes);
        combinedLists.forEach(function(d){
            test.ok(d[0] === d[1].id);
        });
        test.done();
    },

    setParameterTest : function(test){
        let shell = makeShell();
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
        test.done();
    },

    linkTest : function(test){
        let shell = makeShell(),
            newNode = shell.addNode('test1','child'),
            node2 = shell.addNode('test2','child');
        shell.cd(newNode.id);
        let thirdNode = shell.addNode('test3','child');
        shell.cd(node2.id);

        test.ok(thirdNode.linkedNodes[newNode.id] === 'parent');
        test.ok(shell.cwd.id === node2.id);

        shell.link(thirdNode.id,'child','parent');
        test.ok(shell.cwd.linkedNodes[thirdNode.id] === 'child');
        test.ok(shell.allNodes[thirdNode.id].name === thirdNode.name);
        test.ok(shell.allNodes[thirdNode.id].linkedNodes[node2.id] === 'parent');
        test.done();
    },

    rmTest : function(test){
        let shell = makeShell(),
            newNode = shell.addNode('test1','child');
        test.ok(shell.cwd.linkedNodes[newNode.id] !== undefined);
        test.ok(shell.cwd.linkedNodes[newNode.id] === 'child');
        shell.rm(newNode.id);
        test.ok(shell.cwd.linkedNodes[newNode.id] === undefined);
        
        test.done();
    },

    renameTest : function(test){
        let shell = makeShell();
        test.ok(shell.cwd.name === "__root");
        test.ok(shell.cwd.id === shell.root.id);
        shell.rename("bob");
        test.ok(shell.cwd.name === "bob");
        test.ok(shell.root.name === "bob");
        test.done();
    },


    importJsonTest : function(test){
        let test1Data = require('../testData/test1.json'),
            shell = makeShell();
        test.ok(_.keys(shell.allNodes).length === 1);
        shell.importJson(test1Data);
        test.ok(_.keys(shell.allNodes).length === 7,_.keys(shell.allNodes));
        
        test.done();
    },

};
