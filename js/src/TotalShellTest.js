if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

var _ = require('underscore');

var TotalShell = require('./TotalShell');

var makeShell = function(){return new TotalShell.CompleteShell();};


exports.TotalShellTests = {

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
        var newNode = shell.addNode('children','GraphNode','testNode');
        test.ok(shell.cwd.children[newNode.id] !== undefined);
        test.ok(shell.cwd.children[newNode.id].tags.type === "GraphNode");
        test.ok(shell.cwd.children[newNode.id].id === newNode.id);
        test.done();
    },

    createMultipleNodes : function(test){
        var shell = makeShell();
        var n1 = shell.addNode('children','GraphNode','test1');
        var n2 = shell.addNode('children','GraphNode','test2');
        test.ok(n1.id !== n2.id);
        test.ok(Object.keys(shell.cwd.children).length === 2);
        test.done();
    },

    createParentNode : function(test){
        var shell = makeShell();
        var parentNode = shell.addNode('parents','GraphNode','test1');
        test.ok(parentNode !== undefined);
        test.ok(Object.keys(shell.cwd.parents).length === 1);
        test.ok(shell.cwd._originalParent === undefined);
        test.done();
    },

    changeDirTest : function(test){
        var shell = makeShell();
        var child = shell.addNode('children','GraphNode','test1');
        test.ok(Object.keys(shell.cwd.children).length === 1);
        shell.cd(child.id);
        test.ok(shell.cwd.id === child.id);
        shell.cd(shell.root.id);
        test.ok(shell.cwd.id === shell.root.id);
        shell.cd(child.id);
        test.ok(shell.cwd.id === child.id);
        test.done();
    },

    changeDirNameTest : function(test){
        var shell = makeShell();
        var child = shell.addNode('children','GraphNode','test1');
        test.ok(shell.root.id === shell.cwd.id);
        shell.cd('test1');
        test.ok(shell.cwd.id === child.id);        
        test.done();
    },
    
    addTypesOfNodeTest : function(test){
        var shell = makeShell();
        var child1 = shell.addNode('children','Role','test1');
        test.ok(child1.tags.type === "Role");
        test.ok(child1._originalParent.id === shell.cwd.id);

        var child2 = shell.addNode('children','Institution','test2');
        test.ok(child2.tags.type === "Institution");
        test.ok(child2._originalParent.id === shell.cwd.id);
        test.done();        
    },

    checkRoleConstructionTest : function(test){
        var shell = makeShell();
        var newNode = shell.addNode('children','Role','blah');
        shell.cd('blah');
        test.ok(newNode.id === shell.cwd.id);

        test.ok(newNode.tags.type === 'Role');
        test.ok(newNode.children.Rules !== undefined);
        test.ok(newNode.name === 'blah');
        test.done();
    },

    checkInstitutionConstructionTest : function(test){
        var shell = makeShell();
        var newNode = shell.addNode('children','Institution','bloo');
        test.ok(newNode.tags.type === 'Institution');
        test.ok(newNode.children.Roles !== undefined);
        test.ok(newNode.children.Activities !== undefined);
        test.ok(newNode.children.Governance !== undefined);
        test.ok(newNode.children.OutgoingInterface !== undefined);
        test.ok(newNode.children.facts !== undefined);
        test.ok(newNode.children.norms !== undefined);
        test.ok(newNode.parents.IncomingInterface !== undefined);
        test.done();
    },

    checkRuleConstructionErrorFromAddNodeTest : function(test){
        var shell = makeShell();
        test.throws(function(){
            shell.addNode('children','Rule','blah');
        });
        test.done();
    },

    checkRuleContainerConstructionTest : function(test){
        var shell = makeShell();
        var newNode = shell.addNode('children','RuleContainer','rCon1');
        test.ok(newNode.tags.type === 'RuleContainer');
        test.ok(newNode.rules.length === 0);
        test.done();
    },
    
    //TODO: make rule inherit from GraphNode?
    checkRuleConstructionTest : function(test){
        var shell = makeShell();
        var container = shell.addNode('children','RuleContainer','rc1');
        shell.cd('rc1');
        test.ok(shell.cwd.tags.type === "RuleContainer");
        var newRule = shell.addRule('blah');
        test.ok(newRule.tags.type === 'Rule');
        test.ok(newRule.name === 'blah');
        test.ok(newRule.actions.length === 0);
        test.ok(newRule.conditions.length === 0);
        test.done();
    },

    checkActivityConstructionTest : function(test){
        var shell = makeShell();
        var newNode = shell.addNode('children','Activity','bloo');
        test.ok(newNode.name === 'bloo');
        test.ok(newNode.tags.type === 'Activity');
        test.ok(newNode.values.actor === null);
        test.ok(newNode.values.object === null);
        test.ok(newNode.values.tool === null);
        test.ok(newNode.children.Rules !== undefined);
        test.ok(newNode.children.Community !== undefined);
        test.ok(newNode.children.DivisionOfLabour !== undefined);
        test.done();
    },

    //TODO: for later when initial form is working
    checkTestConstructionTest : function(test){
        test.done();
    },

    checkActionConstructionTest : function(test){
        test.done();
    },
    
    getNodeListByIdsTest : function(test){
        var shell = makeShell();
        var nodes = [];
        nodes.push(shell.addNode('children','GraphNode','test1'));
        nodes.push(shell.addNode('children','GraphNode','test2'));
        shell.cd(nodes[1].id);
        nodes.push(shell.addNode('children','GraphNode','test3'));
        nodes.push(shell.addNode('children','GraphNode','test4'));
        nodes.push(shell.addNode('children','GraphNode','test5'));
        nodes.push(shell.addNode('children','GraphNode','test6'));

        var ids = nodes.map(function(d){
            return d.id;
        });
        var retrievedNodes = shell.getNodeListByIds(ids);
        //check every id and node align
        var combinedLists = _.zip(ids,retrievedNodes);
        combinedLists.map(function(d){
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
        var newNode = shell.addNode('children','GraphNode','blah');
        var node2 = shell.addNode('children','GraphNode','other');
        shell.cd(newNode.id);
        var thirdNode = shell.addNode('children','GraphNode','childOfnewNode');
        shell.cd(node2.id);

        test.ok(thirdNode._originalParent.id === newNode.id);
        test.ok(shell.cwd.id === node2.id);

        shell.link('parents',thirdNode.id);
        test.ok(shell.cwd.parents[thirdNode.id].name === thirdNode.name);
        test.done();
    },

    rmTest : function(test){
        var shell = makeShell();
        var newNode = shell.addNode('children','GraphNode','test');
        test.ok(shell.cwd.children[newNode.id] !== undefined);
        test.ok(shell.cwd.children[newNode.id].name === newNode.name);

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

    addRuleTest : function(test){
        var shell = makeShell();
        var container = shell.addNode('children','RuleContainer','rc1');
        shell.cd('rc1');
        test.ok(shell.cwd.rules.length === 0);
        
        var newRule = shell.addRule('testRule1');

        test.ok(shell.cwd.rules.length === 1);
        test.ok(shell.cwd.rules[0].name === "testRule1");
        
        test.done();
    },

    //Rule modifications
    //when in a rule, be able to:
    //add and remove conditions
    addRemoveConditionTest : function(test){
        test.done();
    },

    //add and remove bindings for conditions
    addRemoveBindingTest : function(test){
        test.done();
    },

    //add and remove actions (actions being... parameterised activities?)
    addRemoveActionTest : function(test){
        test.done();
    },



    //Display conversion tests
    //check functions for converting nodes/rules etc to
    //simple array formats for visualisation




    
    //without needing to be in that specific part of the institution:
    //be able to add facts/roles/activities/rules..
    //add new [incumbent|challenger|governed]
    //add new activity
};
