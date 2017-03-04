"use strict";
let genericTests = require('./ShellTest'),
    ctorTests = require('./constructor_tests'),
    node_addition_tests = require('./shell_node_addition_tests'),
    node_deletion_tests = require('./shell_node_deletion_tests'),
    node_mod_tests = require('./shell_node_mod_tests'),
    search_tests = require('./shell_search_tests'),
    state_change_tests = require('./shell_state_change_tests'),
    string_tests = require('./shell_string_tests'),
    rete_tests = require('./shell_rete_tests'),
    json_tests = require('./shell_json_tests'),
    graph_search_tests = require('./shell_graph_search_tests');

exports.allTests = [
    genericTests,
    ctorTests,
    node_addition_tests,
    node_deletion_tests,
    node_mod_tests,
    search_tests,
    state_change_tests,
    string_tests,
    rete_tests,
    json_tests,
    graph_search_tests    
];
