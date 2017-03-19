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

class Link{
    //Create an edge between two nodes
    constructor(sourceId,destId){
        this.sourceId = sourceId;
        this.destId = destId;
    }
}

class SetTag {
    //set the tag of a node
    constructor(tagName){
        this.tagName = tagName;
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
    //stash/unstash/root/cwd/help/export
    constructor(name){
        this.name = name;
    }
}

export { Cd, Rm, Mk, Link, SetTag, SetValue, Search, Refine, Apply, Unparameterised, Import };
