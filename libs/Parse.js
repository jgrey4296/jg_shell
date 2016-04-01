if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}
/**
   tracery style parsing/text generation
   Assumes objects are of the form ${name} to denote rules
   ie: { start: "${greeting}", greeting: "hello" };
   *   Uses 1-10 registered ordered parsing, so "$2{something} $1{else}"
   will have 'else' expanded first
   *   Can store temporary subgrammars using ${#push} and ${#pop},
   assignment with ${#=key:val}
   @module Parse
*/
define(['underscore'],function(_){
    "use strict";
    
    /**
       Take a grammar, create a trace expansion
       @function
       @alias module:Parse
       @param grammarObj
       @param start
       @param depth
     */
    var ParseObject = function(grammarStack,start,depth){
        "use strict";
        depth = depth || 1;
        if(depth > 50){
            //console.warn("Parse depth > 50");
            return start;
        }

        //perform instructions:
        //console.log(start);
        if(start.match(/^#push$/)){
            grammarStack.push({});
            return "";
        }else if(start.match(/^#pop$/)){
            grammarStack.pop();
            return "";
        }else if(start.match(/^#=/)){
            let pair = /^#=([\w\s]+):([\w\s]+)$/.exec(start);
            if(pair !== null){
                _.last(grammarStack)[pair[1]] = ParseObject(grammarStack,pair[2],depth+1);
                return "";
            }
        }
        
        //Get the rule's string
        let currentString = start,
            i = grammarStack.length;

        while(--i >= 0){
            if(grammarStack[i][start] !== undefined){
                currentString = grammarStack[i][start];
                i = -1; //break out;
            }
        }

        //get one of the options
        if(currentString instanceof Array){
            currentString = _.sample(currentString);
        }

        for(let n = 0; n < 10; n++){
            //ordered EXPANSION
            let VarRegex = new RegExp(`\\$${n < 1 ? "" : n}{(#?=?[\\w:]+)}`),
                variable = VarRegex.exec(currentString);
            //console.log("Vrg:",VarRegex);
            while(variable !== null){
                //console.log("Matched:",variable);
                let result = ParseObject(grammarStack,variable[1],depth+1);
                //console.log("result:",result);
                //Deal with actual variables:
                currentString = strSplice(currentString,variable.index,variable.index+variable[0].length,result);
                variable = VarRegex.exec(currentString);
            }
            
        }
        return currentString;
    };


    var strSplice = function(str,start,end,replace){
        return str.slice(0,start) + (replace || "") + str.slice(end);
    };

    
    return ParseObject;
});
