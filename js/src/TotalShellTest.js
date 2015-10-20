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
        test.ok(shell.allNodes.length === 1);
        test.ok(shell.allRules.length === 0);
        test.ok(Object.keys(shell.allRulesByName).length === 0);
        test.ok(shell.cwd.id === shell.root.id);
        test.done();
    },

    createNodeTest : function(test){
        var shell = makeShell();
        var newNode = shell.addNode('children','GraphNode','testNode');
        test.ok(shell.cwd.children['testNode'] !== undefined);
        test.ok(shell.cwd.children['testNode'].tags.type === "GraphNode");
        test.ok(shell.cwd.children['testNode'].id === newNode.id);
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
        test.ok(false);
        test.done();
    },

    clearParameterTest : function(test){
        test.ok(false);
        test.done();
    },
    
    linkTest : function(test){
        test.ok(false);
        test.done();
    },

    rmTest : function(test){
        test.ok(false);
        test.done();
    },

    renameTest : function(test){
        test.ok(false);
        test.done();
    },
    
    addBindingTest : function(test){
        test.ok(falspe);
        test.done();
    },

    removeBindingTest : function(test){
        test.ok(false);
        test.done();
    },



    
    //add institution "blah"
    //add new governance    
    //cd [roles|activities|externalRelations|factGrammar|norms|governance]

    //without needing to be in that specific part of the institution:
    //be able to add facts/roles/activities/rules..
    //add new [incumbent|challenger|governed]

    //add new activity

    
    

};
