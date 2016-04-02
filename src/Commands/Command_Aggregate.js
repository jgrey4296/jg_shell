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
define(['Commands/BookMarkCommands','Commands/GeneralCommands','Commands/NodeCommands','Commands/ReteCommands','Commands/RuleCommands','Commands/SimulationCommands','Commands/TraceCommands','Commands/FSMCommands'],function(bkmkC,genC,nodeC,reteC,ruleC,simC,traceC,FSMC){

    /** @alias module:Commands/Command_Aggregate */
    return {
        "node" : nodeC,
        "rule" : ruleC,
        "rete" : reteC,
        "general" : genC,
        "sim"  : simC,
        "bookmark" : bkmkC,
        "trace" : traceC,
        "fsm" : FSMC
    };
});

