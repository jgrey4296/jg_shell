/**
   @file utils
   @purpose defines general utilities to use across projects
 */
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore'],function(_){

    var util = {};

    //utility function to check input values for commands:
    util.valueCheck = function(list,requiredLength){
        if(list.length !== requiredLength){
            throw new Error("Incorrect number of arguments: " + list);
        }
    };

    
    util.randomChoice = function(array){
        var randIndex = Math.floor(Math.random() * array.length);
        return array[randIndex];
    };

    
    util.textAlignPairs = function(arrayOfPairs){
        console.log("Aligning:",arrayOfPairs);
        //Get the largest strings on each side
        var maxStringLengthLHS = Math.max.apply(null,arrayOfPairs.map(function(d){
            return d[0].length;
        }));
        
        var maxStringLengthRHS = Math.max.apply(null,arrayOfPairs.map(function(d){
            return d[1].length;
        }));

        var totalStringLength = Math.max(maxStringLengthLHS,maxStringLengthRHS);
        
        //Align each side
        var alignedPairs = arrayOfPairs.map(function(d){
            var lhsDifference = d[1].length - d[0].length
                rhsDifference = d[0].length - d[1].length,
                lhs = "",rhs = "";
            
            if(lhsDifference > 0){
                lhs = Array(lhsDifference).join("_") + d[0];
            }else{
                lhs = d[0];
            }
            if(rhsDifference > 0){
                rhs = Array(rhsDifference).join("_") + d[1];
            }else{
                rhs = d[1];
            }
            return [lhs,rhs];
        });

        return alignedPairs;
    };

    
    return util;
});
