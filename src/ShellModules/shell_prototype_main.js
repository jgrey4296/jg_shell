import _ from 'lodash';
import { shellJson } from './shell_json';
import { shellDeletion } from './shell_node_deletion';
import { shellMod } from './shell_node_mod';
import { shellRete } from './shell_rete';
import { shellSearch } from './shell_search';
import { shellString } from './shell_string';
import { shellGraphSearch } from './shell_graph_search';
import { shellStateChange } from './shell_state_change';
import { shellSimulation } from './shell_simulation';
import { shellFSM } from './shell_fsm';

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
   @requires module:ShellModules/shell_simulation
   @requires module:ShellModules/shell_fsm
*/
let shellPrototype = _.extend({},
                              shellJson, shellDeletion,
                              shellMod, shellRete, shellSearch, shellString,
                              shellGraphSearch, shellStateChange,shellSimulation,
                              shellFSM);
//console.log("Shell Prototype:",shellPrototype);

export { shellPrototype };

