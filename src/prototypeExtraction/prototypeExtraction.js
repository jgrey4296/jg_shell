if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore'],function(_){
    "use strict";
    
    /**
       @function prototypeExtraction
       @purpose To extract, from a list of objects, the unique objects that are described
     */
    var prototypeExtraction = function(listOfObjects){
        var theSet = new Set();

        listOfObjects.forEach(function(d){
            theSet.add(_.keys(d).join("|"));
        });
                        
        return Array.from(theSet);
    };

    /**
       @function valueExtraction
       @purpose To extract, from a list of objects, the values that are used in each slot in the objects
     */
    var valueExtraction = function(listOfObjects){
        var valueSets = {};

        listOfObjects.forEach(function(d){
            _.keys(d).forEach(function(key){
                if(valueSets[key] === undefined) valuesObj[key] = new Set();
                valueSets[key].add(d[key]);
            });
        });

        //now convert back
        var outObj = {};
        _.keys(valueSets).forEach(function(key){
            outObj[key] = Array.from(valueSets[key]);
        });

        return outObj;

    };

    /**
       @function getFullPrototype
       @purpose To describe, as much as possible, the object that needs to be authored, given some keys and related values
     */
    var getFullPrototype = function(keyList,valueList,keys,values){
        //given a list of extracted prototype keys and values,
        //and a template of keys and values, return the object and its values
    };

    
    return prototypeExtraction;
    
});
