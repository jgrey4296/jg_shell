var _ = require('underscore');
var pe = require('../src/prototypeExtraction/prototypeExtraction');

exports.prototypeExtractionTests = {

    init : function(test){
        test.ok(typeof pe === 'function');        
        test.done();
    },

    simpleTest : function(test){
        var objList = [
            {a : 2, b :3},
            {a : 2, c: 4},
        ];
        var protos = pe(objList);

        //check that the returned list has [a,b] and [a,c]
        //WITHOUT assuming ordering
        test.ok(_.contains(protos,"a|b"));
        test.ok(_.contains(protos,"a|c"));
        
        
        test.done();
    },

    compareTwoPrototypeLists : function(test){
        var conditionList = [
            {a:2,b:3,c:5},
            {type:"blah",something:"else"}
        ];

        var assertList = [
            {a:1,b:1,c:1},
            {type:1,something:1},
            {"else":1},//the only different object of the two lists
        ];

        var proto1 = pe(conditionList);
        var proto2 = pe(assertList);

        console.log("Proto1:",proto1);
        console.log("Proto2:",proto2);
        
        var conditionDifference = _.difference(proto1,proto2);
        console.log("Condition Difference:",conditionDifference);

        test.ok(conditionDifference.length === 0); //all conditions should be satisfied by assertions
                
        var assertionDifference = _.difference(proto2,proto1);
        console.log("Assertion difference:",assertionDifference);
        test.ok(assertionDifference.length === 1); //1 assertion is not used

        
        test.done();
    },
    
    


};
