/**
   Aggregate all Commands together
   @module Commands/Command_Aggregate
 */
define(['Commands/BookMarkCommands','Commands/GeneralCommands','Commands/NodeCommands','Commands/ReteCommands','Commands/RuleCommands','Commands/SimulationCommands','Commands/TraceCommands'],function(bkmkC,genC,nodeC,reteC,ruleC,simC,traceC){


    /** @alias module:Commands/Command_Aggregate */
    return {
        "node" : nodeC,
        "rule" : ruleC,
        "rete" : reteC,
        "general" : genC,
        "sim"  : simC,
        "bookmark" : bkmkC,
        "trace" : traceC,
    };
});

