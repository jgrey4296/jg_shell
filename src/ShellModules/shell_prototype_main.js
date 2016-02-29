if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','./shell_json','./shell_node_addition','./shell_node_deletion','./shell_node_mod','./shell_rete','./shell_search','./shell_string','./shell_graph_search','./shell_state_change'],function(_,shellJson,shellAddition,shellDeletion,shellMod,shellRete,shellSearch,shellString,shellGraphSearch,shellStateChange){
    "use strict";
    /**
       Aggregates different components of the shell into one prototype
       @exports ShellModules/shell_prototype_main       
       @requires module:ShellModules/shell_json
       @requires module:ShellModules/shell_node_addition
       @requires module:ShellModules/shell_node_deletion
       @requires module:ShellModules/shell_node_mod
       @requires module:ShellModules/shell_rete
       @requires module:ShellModules/shell_search
       @requires module:ShellModules/shell_string
       @requires module:ShellModules/shell_graph_search
       @requires module:ShellModules/shell_state_change
     */
    var shellPrototype = _.extend({},
                                  shellJson, shellAddition, shellDeletion,
                                  shellMod, shellRete, shellSearch, shellString,
                                  shellGraphSearch, shellStateChange);
    //console.log("Shell Prototype:",shellPrototype);

    return shellPrototype;
});
