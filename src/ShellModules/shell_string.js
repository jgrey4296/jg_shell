import _ from 'lodash';
import { Parse } from '../Parse';

/**
   Defines Shell prototype methods relating to string modification. mainly utilities
   @exports ShellModules/shell_string
*/
let ShellPrototype = {};


/**
   To retrieve the actual node objects indicated by an array of ids
   @method
   @param idList
   @return array of node objects
*/
ShellPrototype.getNodeListByIds = function(idList){
    let retList = idList.map(function(d){
        return this.getNode(d);
    },this).filter((d) => { return d;});
    return retList;
};

//Utility functions for display Output:
/**
   To convert a node to a text representation for display on screen
   @method
   @param node
*/
ShellPrototype.nodeToShortString = function(node){
    console.log("NTSS:",node);
    if (node.tags.type === "action"){
        return "(" + node.id + "): " + node.name;
    } else if (node.tags.type === "aggregate"){
        return "Group of: " + node.noOfValues;
    } else if (node.name){
        return "(" + node.id + "): " + node.name + " (" + node.tags.type + ")";
    }
    return "(" + node.id + "): (" + node.tags.type + ")";
};

/**
   Convert node and subnodes to a tracery style string
   @method
   @param node
*/
ShellPrototype.traceNode = function(node){
    //create the grammar object:
    //first get relevant descendant rules
    let shellRef = this,
        descendents = this.dfs(node.id).map(function(d){
            return this.getNode(d);
        },this),
        //fold into a single grammar object
        grammar = descendents.reduce((m,v) => {
            if (m[v.id] === undefined){
                m[v.id] = [];
            }
            if (v.values.message !== undefined){
                //deprecated: convert the message to use id numbers instead of let names
                let children = _.toPairs(v.linkedNodes).filter(d=>/^child/.test(d[1])).map(d=>shellRef.getNode(d[0])),
                    invertedChildren = children.reduce((u ,y)=>{
                        u[y.name] = y.id;
                        return u;
                    },{}),
                    message = v.values.message,
                    regex = /\$(\d)?{(\w+)}/g,
                    matchResult = regex.exec(message);
                //no substrings to expand:
                if (matchResult === null){
                    m[v.id] = [message];
                } else {
                    //todo: filter vars that are defined in values,
                    //use them in preference to descendents
                    while (matchResult !== null){
                        let id = invertedChildren[matchResult[2]] || matchResult[2],
                            replacement = matchResult[1] === undefined ? `\${${id}}` : `\$${matchResult[1]}{${id}}`;
                        message = message.replace(matchResult[0],replacement);
                        matchResult = regex.exec(message);
                    }
                    m[v.id].push(message);
                }
            } else {
                //turn each child into a rule
                //m[v.id] = _.values(v.children).length > 0 ? m[v.id].concat(_.keys(v.children).map(function(d){
                //turn each child into a rule, or use the name of the node
                let children = _.toPairs(v.linkedNodes).filter((d) => d[1].match(/^child/));
                m[v.id] = children.length > 0 ? m[v.id].concat(children.map((d) => {
                    return "${"+d[0] + "}";
                })) : m[v.id].concat([v.name]);
            }
            return m;
        },{});

    console.log("Tracing for Grammar:",grammar);
    
    let retString;
    try {
        retString = Parse([grammar],node.id);
    } catch (e) {
        console.log("Trace error:",e);
    }
    //TODO: check this, was wrapped in a finally
    return retString || node.name;
};



export { ShellPrototype as shellString };

