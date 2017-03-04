"use strict";

let getCtor = require('../../src/Node/Constructors');

exports.getCtorTests = {

    init_graphnode_test : function(test){
        let ctor = getCtor(),
            gn = new ctor();
        test.ok(gn !== undefined);
        test.ok(gn.tags.type === 'graphnode');
        test.done();
    },

    named_ctor_test : function(test){
        let gn_ctor = getCtor('graphnode'),
            gn = new gn_ctor();
        test.ok(gn !== undefined);
        test.ok(gn.tags.type === 'graphnode');
        test.done();
    },

    capitalised_test : function(test){
        let gn_ctor = getCtor('GraphNode'),
            gn = new gn_ctor();
        test.ok(gn !== undefined);
        test.ok(gn.tags.type === 'graphnode');
        test.done();
    },

    bad_name_test : function(test){
        let gn_ctor = getCtor('awegjoawieg'),
            gn = new gn_ctor();
        test.ok(gn !== undefined);
        test.ok(gn.tags.type === 'graphnode');
        test.done();
    },

    rule_ctor_test : function(test){
        let rule_ctor = getCtor('rule'),
            rule = new rule_ctor();
        test.ok(rule !== undefined);
        test.ok(rule.tags.type === 'rule');
        test.done();
    },

    condition_ctor_test : function(test){
        let cond_ctor = getCtor('condition'),
            cond = new cond_ctor();
        test.ok(cond !== undefined);
        test.ok(cond.tags.type === 'condition');
        test.done();        
    },

    action_ctor_test : function(test){
        let action_ctor = getCtor('action'),
            action = new action_ctor();
        test.ok(action !== undefined);
        test.ok(action.tags.type === 'action');
        test.done();        
    },

    institution_ctor_test : function(test){
        let inst_ctor = getCtor('institution'),
            inst = new inst_ctor();
        test.ok(inst !== undefined);
        test.ok(inst.tags.type === 'institution');
        test.done();
    },

    bookmark_ctor_test : function(test){
        let bkmk_ctor = getCtor('bookmark'),
            bkmk = new bkmk_ctor();
        test.ok(bkmk !== undefined);
        test.ok(bkmk.tags.type === 'bookmark');
        test.done();
    },

    fsm_ctor_test : function(test){
        let fsm_ctor = getCtor('fsm'),
            fsm = new fsm_ctor();
        test.ok(fsm !== undefined);
        test.ok(fsm.tags.type === 'fsm');
        test.done();
    },

    state_ctor_test : function(test){
        let state_ctor = getCtor('state'),
            state = new state_ctor();
        test.ok(state !== undefined);
        test.ok(state.tags.type === 'state');
        test.done();
    },

    event_ctor_test : function(test){
        let event_ctor = getCtor('event'),
            event = new event_ctor();
        test.ok(event !== undefined);
        test.ok(event.tags.type === 'event');
        test.done();
    },
    
};
