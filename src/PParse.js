/* eslint camelcase: "off" */
/*
  Parsimmon based parsing
*/
import * as P from 'parsimmon';
import * as CStructs from './Commands/CommandStructures';

//Utility
//Optional whitespace wrapper:
let OWS = ( parser ) => { return P.optWhitespace.then(parser).skip(P.optWhitespace); },
    //non-optional whitespace sequence
    PWS = ( parser ) => { return parser.skip(P.whitespace); },
    WPW = ( parser ) => { return P.whitespace.then(parser).skip(P.whitespace); };

//Simple unparameterised parsing:
let unparameterisedCmnds = "unstash stash root cwd help export prior clear",
    unParParsers = P.alt(...unparameterisedCmnds.split(' ').map(d=>P.string(d))),
    UPP_Results = unParParsers.map((r)=>new CStructs.Unparameterised(r));


//Parameterised Command Literals
//Short Command literals:
let SHORT_TAG = P.string('#'),
    SHORT_VAL = P.string('$'),
    COLON = PWS(P.string(':')),
    SHORT_LINK = P.string('>'),
    SHORT_CD = P.string('@'),
    SHORT_PRIOR = P.string('<'),
    //long command literals
    CD = PWS(P.alt(P.string('cd'),SHORT_CD)),
    MK = PWS(P.string('mk')),
    LINK = PWS(P.string('link')),
    RM = PWS(P.string('rm')),
    SET = PWS(P.string('set')),
    TAG = PWS(P.alt(P.string('tag'),SHORT_TAG)),
    VALUE = PWS(P.alt(P.string('value'),SHORT_VAL)),
    SEARCH = PWS(P.string('search')),
    REFINE = PWS(P.string('refine')),
    APPLY = PWS(P.string('apply')),
    IMPORT = PWS(P.string('import')),
    SELECT = PWS(P.string('select'));


//Values
let str_val = OWS(P.regex(/[a-zA-Z][a-zA-Z0-9_$]*/)),
    str_lit = P.string('"').then(P.regex(/[a-zA-Z0-9\- '$%{}&;:.]+/)).skip(P.string('"')),
    id = OWS(P.regex(/[0-9]+/).map(Number)),
    parent = OWS(P.string('..')),
    num = P.regex(/-?[0-9]+(\.[0-9]+)?/).map(Number), //todo: convert to number
    //Values combined:
    com_vals = P.alt(str_val,str_lit,num).skip(P.optWhitespace),
    //Regular expression... regex:
    regex_term = P.string('/'),
    regex_core = P.regex(/[ .a-zA-Z'"0-9-+=_!@#$%^&*()\[\]|]+/),
    regex_flags = P.regex(/[gimuy]*/),
    regex = regex_term.then(P.seqMap(regex_core.skip(regex_term),
                                     regex_flags.skip(regex_term),
                                     (r,f)=>RegExp(r,f))).skip(P.optWhitespace);

//Actual commands:
let cd_cmd = CD.then(P.alt(id,parent,str_val)).map((r)=>new CStructs.Cd(r)),
    mk_cmd = MK.then(str_val.many()).map((rs)=>new CStructs.Mk(...rs)),
    link_cmd = LINK.then(P.seqMap(id,id,(src,tgt)=>new CStructs.Link(src,tgt))),
    rm_cmd = RM.then(id.many()).map((ids)=>new CStructs.Rm(...ids)),
    set_tag_cmd = SET.then(TAG).then(str_val.many()).map((r)=>new CStructs.SetTag(r)),
    set_val_cmd = SET.then(VALUE).then(P.seqMap(str_val,com_vals,(a,b)=>new CStructs.SetValue(a,b))),
    import_cmd = IMPORT.then(P.all).map((t)=>new CStructs.Import(t)),
    //Short commands
    short_tag_cmd = SHORT_TAG.then(str_val).map((r)=>new CStructs.SetTag([r])),
    short_val_cmd = SHORT_VAL.then(P.seqMap(str_val.skip(COLON),
                                            com_vals,
                                            (a,b)=>new CStructs.SetValue(a,b))),
    short_link_cmd = P.seqMap(id.skip(SHORT_LINK),
                              id,
                              (src,tgt)=>new CStructs.Link(src,tgt)),
    short_cd_cmd = SHORT_CD.then(P.alt(id,parent,str_val)).map((r)=>new CStructs.Cd(r)),
    short_prior_cmd = SHORT_PRIOR.then(P.eof).map(()=>new CStructs.Unparameterised('prior'));

//Searching and Refining:
//Searching:
let search_cmd_short = SEARCH.then(P.seqMap(str_val,regex,(v,r)=>new CStructs.Search(v,r))),
    search_cmd_long = SEARCH.then(P.seqMap(str_val,P.alt(str_val,regex),P.alt(id,regex),(v,r,r2)=>new CStructs.Search(v,r,r2))),
    //Refining:
    refine_cmd_short = REFINE.then(P.seqMap(str_val,regex,(v,r)=>new CStructs.Refine(v,r))),
    refine_cmd_long = REFINE.then(P.seqMap(str_val,regex,regex,(v,r,r2)=>new CStructs.Refine(v,r,r2)));

    

//Aggregates
let cmd_list = P.alt(mk_cmd,
                     link_cmd,
                     rm_cmd,
                     set_tag_cmd,
                     set_val_cmd,
                     search_cmd_long,
                     search_cmd_short,
                     refine_cmd_long,
                     refine_cmd_short
                    );

let short_cmd_list = P.alt(short_tag_cmd,
                           short_val_cmd,
                           short_link_cmd,
                           short_cd_cmd,
                           short_prior_cmd);




let apply_cmd = APPLY.then(P.alt(short_cmd_list,cmd_list)).map((cmd)=>new CStructs.Apply(cmd));

let ROOT = P.alt(apply_cmd, short_cmd_list, cd_cmd, import_cmd, UPP_Results, cmd_list);

export { ROOT as parser };


/*
  search id {number}
  search name {regex}
  search tag {regex}
  search value {regex}
  search value {regex} {regex}
  refine name {regex}
  refine tag {regex}
  refine value {regex}
  refine value {regex} {regex}
  apply {command}
*/
