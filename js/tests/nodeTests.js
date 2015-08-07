var Shell = require('../src/shell');
var aShell = new Shell();

var Node = aShell.__Node;

exports.nodetests = {
    initTest : function(test){
        var aNode = new Node();
        test.ok(aNode !== null || aNode !== undefined);
        test.done();
    },

    //Test ctor: name, no values/parent/parentName
    ctorTest : function(test){
        var aNode = new Node();
        test.ok(aNode.id === 2);
        var aNode2 = new Node();
        test.ok(aNode2.id === 3);

        test.ok(aNode.name === undefined);
        test.done();
    },
    
    //Test ctor: name, value array, no parent/parentName
    nameTest : function(test){
        var aNode = new Node("blah");
        test.ok(aNode.name === "blah");
        test.done();
    },
    
    //Test ctor: name, value object, no parent/parentName
    nameValueTest : function(test){
        var aNode = new Node("blah",{a:2});
        test.ok(aNode.values['a'] === 2);
        test.done();
    },

    //test ctor: array of values
    nameValueArrayTest : function(test){
        var aNode = new Node("blah",['a',1,'b',5]);
        test.ok(aNode.values['a'] === 1);
        test.ok(aNode.values['b'] === 5);
        test.done();
    },

    //test ctor: array of uneven values:
    nameValueArrayTest : function(test){
        var aNode = new Node("blah",['a',2,'b']);
        test.ok(aNode.values['a'] === 2);
        test.ok(aNode.values['b'] === null);
        test.done();
    },
    
    //test ctor: name, value object, parent array
    parentTest : function(test){
        var aNode = new Node("blah",{a:2},[1,2,3,4]);
        test.ok(aNode.name === "blah");
        test.ok(aNode.values['a'] === 2);
        test.ok(aNode.parents[0] === 1);
        test.ok(aNode.parents[3] === 4);
        test.done();
    },

    //test ctor: name, value object, parent singular
    parentSingularTest: function(test){
        var aNode = new Node("blah",{a:2},5);
        test.ok(aNode.parents[0] === 5);
        test.ok(aNode.children['..'] === 5);
        test.done();
    },

    
    //test addchild name and id
    addChildTest : function(test){
        var aNode = new Node("blah");
        aNode.addChild("child",5);
        test.ok(aNode.children['child'] === 5);
        aNode.addChild("bob",10);
        test.ok(aNode.children['bob'] === 10);

        test.throws(function(){
            aNode.addChild('bob','bill');
        });
        
        test.done();
    },
    
    //test remove child
    removeChildTest : function(test){
        var aNode = new Node("blah");
        aNode.addChild("bob",5);
        test.ok(aNode.children['bob'] === 5);
        var returned = aNode.removeChild('bob');
        test.ok(aNode.children['bob'] === undefined);
        test.ok(returned === 5);
        test.done();
    },
    
    //test setValue
    setValue : function(test){
        
        
        test.done();
    },

    
    //test setValue remove

    //test valueArray - no values

    //test valueArray - with values

    //test comparison of nodes
};
