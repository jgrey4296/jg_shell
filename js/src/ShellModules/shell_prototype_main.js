/**
   @file shell_prototype_main
   @object shellPrototype
   @purpose Aggregates different components of the shell into one prototype
*/
define(['underscore','./shell_json','./shell_node_addition','./shell_node_deletion','./shell_node_mod','./shell_rete','./shell_search','./shell_string','./shell_graph_search','./shell_state_change'],function(shellJson,shellAddition,shellDeletion,shellMod,shellRete,shellSearch,shellString,shellGraphSearch,shellStateChange){

    var shellPrototype = _.extend({},
                                  shellJson, shellAddition, shellDeletion,
                                  shellMod, shellRete, shellSearch, shellString,
                                  shellGraphSearch, shellStateChange);


    return shellPrototype;
});
