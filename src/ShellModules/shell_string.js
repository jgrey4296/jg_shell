if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}


define(['underscore','../../libs/Parse'],function(_,Parse){
    "use strict";
    /**
       Defines Shell prototype methods relating to string modification. mainly utilities
       @exports ShellModules/shell_string
     */
    var ShellPrototype = {};


    /**
       To retrieve the actual node objects indicated by an array of ids
       @method
       @param idList
       @return array of node objects
     */
    ShellPrototype.getNodeListByIds = function(idList){
        var retList = idList.map(function(d){
                return this.getNode(d);
        },this).filter(function(d){ return d;});
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
        if(node.tags.type === "action"){
            return "(" + node.id + "): " + node.name;
        }else if(node.tags.type === "aggregate"){
            return "Group of: " + node.noOfValues;            
        }else if(node.name){
            return "(" + node.id + "): " + node.name + " (" + node.tags.type + ")";
        }else{
            return "(" + node.id + "): (" + node.tags.type + ")";
        }
    };

    /**
       Convert node and subnodes to a tracery style string
       @method
       @param node
     */
    ShellPrototype.traceNode = function(node){
        //create the grammar object:
        //first get relevant descendant rules
        let descendents = this.dfs(node.id).map(function(d){
            return this.getNode(d);
        },this),
            //fold into a single grammar object, using id's as rule keys:
            grammar = descendents.reduce(function(m,v){
                if(m[v.id] === undefined){
                    m[v.id] = [];
                }
                if(v.values.message !== undefined){
                    //convert the message to use id numbers instead of var names
                    let invertedChildren = _.invert(v.linkedNodes.children),
                        message = v.values.message,
                        vars = message.match(/\$\w+/g);
                    //no substrings to expand:
                    if(vars === null){
                        m[v.id] = [message];
                    }else{
                        //todo: filter vars that are defined in values, use them in preference to descendents
                      
                        //substring conversion:
                       let ids = vars.map(function(d){
                            return invertedChildren[d.slice(1)];
                        }),
                            //pair with strings to replace
                            zipped = _.zip(vars,ids),
                            //convert vars to ids
                            convertedMessage = zipped.reduce(function(m,v){
                                return m.replace(v[0],"$"+v[1]);
                            },message);
                        m[v.id].push(convertedMessage);
                    }
                }else{
                    //turn each child into a rule
                    //m[v.id] = _.values(v.children).length > 0 ? m[v.id].concat(_.keys(v.children).map(function(d){
                    //turn each child into a rule, or use the name of the node
                    m[v.id] = _.values(v.linkedNodeschildren).length > 0 ? m[v.id].concat(_.keys(v.linkedNodes.children).map(function(d){
                        return "$"+d;
                    })) : m[v.id].concat([v.name]);
               }                
                return m;
            },{});

        console.log("Tracing for Grammar:",grammar);
        
        var retString;
        try{
            retString = Parse(grammar,node.id);
        }catch(e){
            console.log("Trace error:",e);
        }finally{
            return retString || node.name;
        }
    };
    
    

    return ShellPrototype;
});
