if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore'],function(_){

    var prototypeExtraction = function(listOfObjects,root){
        var outObj = [];
        var theSet = new Set();

        listOfObjects.forEach(function(d){
            theSet.add(_.keys(d).join("|"));
        });

        var iter = theSet.values();
        var x = iter.next();
        while(!x.done){
            outObj.push(x.value);
            x = iter.next();
        }
        
        return outObj;
    };

    return prototypeExtraction;
    
});
