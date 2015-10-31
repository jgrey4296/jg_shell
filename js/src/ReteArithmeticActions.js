if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore'],function(_){
    var ArithmeticActions = {
        "+" : function(a,b){
            return a + b;
        },
        "-" : function(a,b){
            return a - b;
        },
        "*" : function(a,b){
            return a * b;
        },
        "/" : function(a,b){
            return a / b;
        },
    };

    return ArithmeticActions;
    
});
