/**
   Data structures for intercommunication between parser and shell
*/

class Cd {
    //Change the directory to the specified node id
    constructor(id){
        this.id = id;
    }
}

class Rm {
    //Delete the specified id
    constructor(...ids){
        this.ids = ids;
    }
}

class Mk {
    //Make new nodes with the following names
    constructor(...names){
        this.names = names;
    }
}


class EdgeData {
    constructor(id=null,data=[]){
        this.id = id;
        this.tags = new Set();
        this.vals = new Map();

        if ( data instanceof Array){
            for (let val of data){
                if (val instanceof SetTag){
                    val.tagNames.forEach((d)=>this.tags.add(d));
                } else if (val instanceof SetValue){
                    this.vals.set(val.valName,val.value);
                } else {
                    throw new Error('Unrecognised val list member');
                }
            }
        } else if (data.tags !== null && data.vals !== null){
            this.tags = new Set(data.tags);
            this.vals = new Map(data.vals);
        }
    }
}

class Link {
    //Create an edge between two nodes
    constructor(sourceData,edgeData, destData){
        this.sourceData = sourceData;
        this.edgeData = edgeData;
        this.destData = destData;
    }
}

class SetTag {
    //set the tag of a node
    constructor(tagName){
        this.tagNames = tagName;
    }
}

class SetValue {
    //set the value of a node
    constructor(valName,value){
        this.valName = valName;
        this.value = value;
    }
}

class Search {
    //Search for a pattern
    //ie: search id 5
    //search value name blah <-- type=value, name=variable, value=blah
    constructor(type,variable,value=null){
        this.type = type;
        this.variable = variable;
        this.value = value;
    }
}

class Refine {
    //search within a search
    constructor(type,variable,value=null){
        this.type = type;
        this.variable = variable;
        this.value = value;
    }
}

class Apply {
    //Apply a command to a search set
    constructor(command){
        this.command = command;
    }
}

class Import {
    //Import a given json string into the shell
    constructor(text){
        this.text = text;
    }
}


class Unparameterised{
    //stash/unstash/root/cwd/help/export/prior/clear/select
    constructor(name){
        this.name = name;
    }
}

export { Cd, Rm, Mk, Link, SetTag, SetValue, Search, Refine, Apply, Unparameterised, Import, EdgeData };
