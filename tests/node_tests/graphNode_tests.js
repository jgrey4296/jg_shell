"use strict";
let GraphNode = require('../../src/Node/GraphNode'),
    _ = require('lodash');

exports.GraphNodeTests = {

    initTest : function(test){
        let gn = new GraphNode();
        test.ok(gn !== undefined);
        test.ok(gn.name === 'anon');
        test.ok(_.keys(gn.linkedNodes).length === 0);
        test.ok(gn.tags.type == 'graphnode');
        test.ok(gn.toString() === '(' + gn.id + ') : ' + gn.name);
        test.done();
    },

    sequenceIdTest : function(test){
        let gn1 = new GraphNode(),
            gn2 = new GraphNode();

        test.ok(gn1.id + 1 === gn2.id);
        test.done();
    },

    nameTest : function(test){
        let gn = new GraphNode('testNode');
        test.ok(gn.name === 'testNode');
        test.done();
    },

    parentTest : function(test){
        let gn = new GraphNode('testNode',5);
        test.ok(gn.name === 'testNode');
        test.ok(gn.linkedNodes[5] === 'parent->original');
        test.done();
    },

    typeTest : function(test){
        let gn = new GraphNode('testNode',2,'blah');
        test.ok(gn.name === 'testNode');
        test.ok(gn.linkedNodes[2] === 'parent->original');
        test.ok(gn.tags.type === 'blah');
        test.done();
    },

    setValueTest : function(test){
        let gn = new GraphNode('testNode',2,'blah');
        test.ok(_.keys(gn.values).length === 0);
        gn.setValue(5,'values','a');
        test.ok(_.keys(gn.values).length === 1);
        test.ok(gn.values['a'] === 5);
        test.done();
    },

    removeValueTest : function(test){
        let gn = new GraphNode('testNode',2,'blah');
        test.ok(_.keys(gn.values).length === 0);
        gn.setValue(5,'values','a');
        test.ok(gn.values['a'] === 5);
        gn.setValue(undefined,'values','a');
        test.ok(_.keys(gn.values).length === 0);
        test.done();
    },

    
    
};
