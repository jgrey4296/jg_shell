import _ from 'lodash';
import * as blessed from 'blessed';
import { SubLayout } from './SubLayout';

class Column extends blessed.box {
    constructor(title  = "Default",
                top    = '10%',
                left   = '5%',
                width  = '25%+1',
                height = '70%+1',
                focusNodeColumn = false){                
        super({
            top: top,
            left: left,
            width: width,
            height: height,
            content: `{center}${title}`,
            tags: true,
            border: {
                type: 'line'
            },
            style: {
                fg: 'white',
                bg: 'black',
                border: {
                    fg: '#f0f0f0'
                },
            }
        });

        this.layouts = new Map();
        
        if (focusNodeColumn === true){
            let box = blessed.box({
                parent: this,
                top: 'center',
                left: 'center',
                width: '95%',
                height: '95%',
                border : {
                    type: 'line'
                }                
            });
            this.layouts.set('tags',new SubLayout(box,'Tags'));
            this.layouts.set('values',new SubLayout(box,'Values'));
        }else{
            this.layouts.set('entries',new SubLayout(this,'','90%'));
        }
    }

    clear(){
        for (var layout of this.layouts.values()){
            layout.clearEntries();
        }
        //_.forEach(this.layouts.values(),(d)=>d.clearEntries());
    }
    
    addSection(text){
        if( ! this.layouts.has('entries')){
            return;
        }
        this.layouts.get('entries').addEntry(text);
    }

    setNodeContent(obj){
        if(!(this.layouts.has('tags') && this.layouts.has('values'))){
            return;
        }
        this.clear();
        //for focused node content
        for ( var tag of obj.tags()){
            this.layouts.get('tags').addEntry(tag);
        }
        for( var valPair of obj.values()){
            let valString = `${valPair[0]} : ${valPair[1]}`;
            this.layouts.get('values').addEntry(valString);
        }
    }    
}


export { Column };
