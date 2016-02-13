/**
   @file shell_prototype_main
   @object shellPrototype
   @purpose Aggregates different components of the shell into one prototype
*/
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','./shell_json','./shell_node_addition','./shell_node_deletion','./shell_node_mod','./shell_rete','./shell_search','./shell_string','./shell_graph_search','./shell_state_change'],function(_,shellJson,shellAddition,shellDeletion,shellMod,shellRete,shellSearch,shellString,shellGraphSearch,shellStateChange){
    "use strict";
    var shellPrototype = _.extend({},
                                  shellJson, shellAddition, shellDeletion,
                                  shellMod, shellRete, shellSearch, shellString,
                                  shellGraphSearch, shellStateChange);
    //console.log("Shell Prototype:",shellPrototype);

    return shellPrototype;
});
