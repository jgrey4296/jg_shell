/**
   @file Tests to verify the shell

 */
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

var _ = require('underscore');

var TotalShell = require('../src/TotalShell');

var makeShell = function(){return new TotalShell.CompleteShell();};


exports.TotalShellTests = {

    initTest : function(test){
        var shell = makeShell();
        test.ok(shell.root !== undefined);
        test.ok(Object.keys(shell.allNodes).length === 3);
        test.ok(shell.allRules.length === 0);
        test.ok(Object.keys(shell.allRulesByName).length === 0);
        test.ok(shell.cwd.id === shell.root.id);
        test.done();
    },

    createNodeTest : function(test){
        var shell = makeShell();
        var newNode = shell.addNode("test",'children');
        test.ok(shell.cwd.children[newNode.id] !== undefined);
        test.ok(shell.cwd.children[newNode.id] === newNode.name);
        test.ok(shell.allNodes[newNode.id].name === newNode.name);
        test.done();
    },

    createMultipleNodes : function(test){
        var shell = makeShell();
        var n1 = shell.addNode("test1",'children');
        var n2 = shell.addNode('test2','children');
        test.ok(n1.id !== n2.id);
        test.ok(Object.keys(shell.cwd.children).length === 2);
        test.done();
    },

    createParentNode : function(test){
        var shell = makeShell();
        var parentNode = shell.addNode('test1','parents');
        test.ok(parentNode !== undefined);
        test.ok(Object.keys(shell.cwd.parents).length === 1);
        test.ok(shell.cwd._originalParent === undefined);
        test.ok(shell.cwd.parents[parentNode.id] === parentNode.name);
        test.ok(parentNode.children[shell.cwd.id] === shell.cwd.name);
        test.done();
    },

    changeDirTest : function(test){
        var shell = makeShell();
        var child = shell.addNode('test1','children');
        test.ok(Object.keys(shell.cwd.children).length === 1);
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
        test.ok(child1._originalParent === shell.cwd.id)

        var child2 = shell.addNode('test2','children','institution');
        test.ok(child2.tags.type === "institution");
        test.ok(child2._originalParent === shell.cwd.id);
        test.done();        
    },

    checkRoleConstructionTest : function(test){
        var shell = makeShell();
        var newNode = shell.addNode('test1','children','role');
        shell.cd('test1');
        test.ok(newNode.id === shell.cwd.id);
        test.ok(newNode.name === 'test1');
        test.ok(newNode.tags.type === 'role');
        test.ok(_.keys(newNode.children).length === 2);
        test.ok(shell.allNodes[_.keys(newNode.children)[0]].name === "ConstitutiveRules");
        test.ok(shell.allNodes[_.keys(newNode.children)[1]].name === "RegulativeRules");

        test.done();
    },

    checkInstitutionConstructionTest : function(test){
        var shell = makeShell();
        var newNode = shell.addNode('test1','children','institution');
        test.ok(newNode.tags.type === 'institution');
        test.ok(_.keys(newNode.children).length === 7,_.keys(newNode.children).length);
        test.ok(_.keys(newNode.parents).length === 2); 
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

    checkActivityConstructionTest : function(test){
        var shell = makeShell();
        var newNode = shell.addNode('test1','children','activity');
        test.ok(newNode.name === 'test1');
        test.ok(newNode.tags.type === 'activity');
        test.ok(newNode.values.actor === null);
        test.ok(newNode.values.object === null);
        test.ok(newNode.values.tool === null);
        test.ok(newNode.values.outcome === null);
        test.ok(_.keys(newNode.children).length === 4);
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

        test.ok(thirdNode._originalParent === newNode.id);
        test.ok(shell.cwd.id === node2.id);

        shell.link('parents',thirdNode.id);
        test.ok(shell.cwd.parents[thirdNode.id] === thirdNode.name);
        test.ok(shell.allNodes[thirdNode.id].name === thirdNode.name);
        test.done();
    },

    rmTest : function(test){
        var shell = makeShell();
        var newNode = shell.addNode('test1','children');
        test.ok(shell.cwd.children[newNode.id] !== undefined);
        test.ok(shell.cwd.children[newNode.id] === newNode.name);
        shell.rm(newNode.id);
        test.ok(shell.cwd.children[newNode.id] === undefined);
        
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


    //SEARCH TESTS:
    searchTest_forChildren : function(test){
        var shell = makeShell();
        shell.addNode("test",'children');
        shell.addNode('test2','children');
        shell.addNode('aewaf','children');
        var foundNodes = shell.search('parents','test');
        test.ok(foundNodes.length === 1,foundNodes.length);
        test.ok(foundNodes[0].id === shell.cwd.id);
        test.done();
    },

    searchTest_forParents : function(test){
        var shell = makeShell();
        var t1 = shell.addNode('test','children');
        var t2 = shell.addNode('test2','children');
        var t3 = shell.addNode('test3','parents');
        var foundNodes = shell.search('children',shell.cwd.id,'id');
        test.ok(foundNodes.length === 2,foundNodes.length);
        test.ok(foundNodes[0].id === t1.id);
        test.ok(foundNodes[1].id === t2.id);
        test.done();
    },

    //make sure the search is across all nodes, not just the current nodes:
    searchTest_checkAllNodes : function(test){
        var shell = makeShell();
        var t1 = shell.addNode('test','children');
        shell.cd(t1.id);
        test.ok(shell.cwd.id === t1.id);
        shell.addNode('test2','children');
        shell.cd(shell.root.id);
        test.ok(shell.cwd.id !== t1.id);
        var foundNodes = shell.search('name','test');
        test.ok(foundNodes.length === 2);
        test.done();
    },


    importJsonTest : function(test){
        var test1Data = require('./testData/test1.json');
        var shell = makeShell();

        test.ok(_.keys(shell.allNodes).length === 3);
        shell.importJson(test1Data);
        test.ok(_.keys(shell.allNodes).length === 7,_.keys(shell.allNodes));
        
        test.done();
    },

    
    //TODO:
    //search for an id

    //search for parents of a pattern

    //search for parents of an id

    //value search for values/tags

    //key search for values/tags
    

    // checkAddConditionToRuleTest : function(test){
    //     test.ok(false);
    //     test.done();
    // },

    // checkAddActionToRuleTest : function(test){
    //     test.ok(false);
    //     test.done();
    // },

    // checkAddConstantTestToCondition : function(test){
    //     test.ok(false);
    //     test.done();
    // },

    // checkAddConstantTestToSpecifiedCondition : function(test){
    //     test.ok(false);
    //     test.done();
    // },

    // checkAddBindingToCondition : function(test){
    //     test.ok(false);
    //     test.done();
    // },

    // checkAddBindingToSpecifiedCondition : function(test){
    //     test.ok(false);
    //     test.done();
    // },

    
    //Display conversion tests
    //check functions for converting nodes/rules etc to
    //simple array formats for visualisation
    
    //without needing to be in that specific part of the institution:
    //be able to add facts/roles/activities/rules..
    //add new [incumbent|challenger|governed]
    //add new activity
};
