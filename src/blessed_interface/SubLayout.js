import _ from 'lodash';
import * as blessed from 'blessed';

class SubLayout extends blessed.Layout {
    constructor(parent,title,height='50%'){
        super({
            content: `{center}${title}`,
            tags: true,
            parent: parent,
            left: 'center',
            width: '90%',
            height: height,
            border: 'line'
        });
        this.items = [];
    }

    clearEntries(){
        _.forEach(this.items,(d)=>d.detach());
        this.items = [];
    }

    addEntry(text){
        this.items.push(new blessed.Text({
            parent: this,
            tags: true,
            content: `{center}${text}`,
            width: '90%',
            height:'10%',
            border: 'line'
        }));
    }
    
}

export { SubLayout };
