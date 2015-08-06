var Shell = require('../src/shell');
var aShell = new Shell();

exports.nodetests = {
    initTest : function(test){
        var aNode = aShell.__Node();
        test.ok(aNode !== null || aNode !== undefined);
        test.done();
    },

    //Test ctor: name, no values/parent/parentName

    //Test ctor: name, value array, no parent/parentName

    //Test ctor: name, value object, no parent/parentName

    //test ctor: name, value object, parent array

    //test ctor: name, value object, parent array

    //test successive id's

    //test addchild name and id

    //test remove child

    //test setValue

    //test setValue remove

    //test valueArray - no values

    //test valueArray - with values

    //test comparison of nodes
};
