/**
   tracery style parsing/text generation
   Assumes objects using $ to denote rules
   ie: { start: "$greeting", greeting: "hello" };
*/
define(['underscore'],function(_){

    var ParseObject = function(grammarObj,start,depth=1){
        if(depth > 50){
            console.warn("Parse depth > 50");
            return `[${start}]`;
        }
        if(grammarObj[start] === undefined){
            //throw new Error("Unrecognised rule: " + start);
            console.warn(`Unrecognised rule: ${start}`);
            return `[${start}]`;
        }
        //Get the rule's string
        var currentString = grammarObj[start];
        //get one of the options
        if(currentString instanceof Array){
            currentString = _.sample(currentString);
        }

        //get the variables that need expansion
        var variables = currentString.match(/\$\w+/g);
        if(variables === null) return currentString;

        //For each variable, expand it
        var returnedStrings = variables.map(function(d){
            return ParseObject(grammarObj,d.slice(1),depth+1);
        }),
            zippedExpansions = _.zip(variables,returnedStrings);

        var finalString = zippedExpansions.reduce(function(m,v){
            return m.replace(v[0],v[1]);
        },currentString);

        return finalString;
    };



    

    return ParseObject;
});
