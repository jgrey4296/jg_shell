import * as bkmkC from './BookMarkCommands';
import * as genC from './GeneralCommmands';
import * as nodeC from './NodeCommands';
import * as reteC from './ReteCommands';
import * as ruleC from './RuleCommands';
import * as simC from './SimulationCommands';
import * as traceC from './TraceCommands';
import * as FSMC from './FSMCommands';
/**
   Aggregate all Commands together
   @see module:Commands/CommandTemplate
   @module Commands/Command_Aggregate
   @requires module:Commands/BookMarkCommands
   @requires module:Commands/GeneralCommands
   @requires module:Commands/NodeCommands
   @requires module:Commands/ReteCommands
   @requires module:Commands/RuleCommands
   @requires module:Commands/SimulationCommands
   @requires module:Commands/TraceCommands
   @requires module:Commands/FSMCommands
 */

/** @alias module:Commands/Command_Aggregate */
let module_interface = {
    "node" : nodeC,
    "rule" : ruleC,
    "rete" : reteC,
    "general" : genC,
    "sim"  : simC,
    "bookmark" : bkmkC,
    "trace" : traceC,
    "fsm" : FSMC
};

export { module_interface };
