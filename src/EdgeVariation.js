/**
   Edge Variations for the shell. 
   Eg: Parent/Child, calls, state/events, instance,
   condition/action/rule, 
 */
import Edge from './Edge';
import _ from 'lodash';

//Symbols/Enum equivalents
let symbolStrings = "Unspecified Parent Child Call State Event Instance Condition Action".split(' '),
    SymbolMap = new Map(_.map(symbolStrings,(d)=>[d,Symbol(d)]));

class MinimalEdgeComponent {
    constructor(){}
}

class EdgeComponent extends MinimalEdgeComponent {
    constructor(id, type="Unspecified"){
        super();
        this.is = id;
        this.type = SymbolMap.get(type);
        this.value = null;
        this.params = null;
    }    
}

