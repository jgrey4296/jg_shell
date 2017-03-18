/*
  A Blessed/ncurses CLI for the shell
*/
import * as blessed from 'blessed';
import _ from 'lodash';
import { Shell } from '../Shell';
import { Column } from './Column';

let shell = new Shell(),
    //The main screen to add everything to
    screen = blessed.screen({
        smartCSR: true,
        title : 'Shell Authoring'
    }),
    //The left column
    left = new Column('Parents'),
    //middle column
    middle = new Column('Node',
                        '10%',
                        `${50-(25/2)}%`,
                        '25%+1',
                        '70%+1',
                        true),
    //the right column
    right = new Column('Right',
                       '10%',
                       `${100-30}%`,
                       '25%+1',
                       '70%+1'),
    //the input bar at the bottom
    text = blessed.textarea({
        top: "90%",
        height: "5%+1",
        left: "center",
        width: "30%+1",
        tags: true,
        border: {
            type: 'line'
        },
        style : {
            bg: "green",
            fg: "black"
        },
        inputOnFocus : true
    });
//Finished creating the sections

screen.append(left);
screen.append(right);
screen.append(middle);
screen.append(text);

//Events and listeners:
text.on('submit',function(e){
    let theText = text.getText(),
        state = null;
    text.clearValue();
    try{
        shell.parse(theText);
        state = shell.parse('cwd');
    } catch(err){
        text.setText(err.message)
    }

    if(state === null){
        return;
    }
    //Setup Left Column
    left.clear();
    let parentNodes = state.inputs.map((d)=>shell.get(d.source.id)),
        parentStrings = parentNodes.map((d)=>`${d.id} : ${d.name()}`);
    parentStrings.forEach((d)=>left.addSection(d));
    
    //Setup Right Column
    right.clear()
    let childNodes = state.outputs.map((d)=>shell.get(d.dest.id)),
        childStrings = childNodes.map((d)=>`${d.id} : ${d.name()}`);
    childStrings.forEach((d)=>right.addSection(d));
    
    //Setup Center
    middle.clear();
    middle.setContent(`{center}${state.node.id} : ${state.node.name()}`);
    middle.setNodeContent(state.node);

    //Update the screen
    screen.render()
});

text.key(['enter'],function(ch,key){
    text.emit('submit');
});

text.key(['C-c'],function(ch,key){
    return process.exit(0);
});

text.key(['C-x'],function(ch,key){
    for(var child of middle.children){
        middle.remove(child);
    }
    screen.render()
});

// Render the screen.
text.focus();
screen.render();

/*
  Node view:
  Top: Path description
  Middle: Parents - Node - Children
  Bottom: input line

  Search Results:
  Middle: list of ids : nodes
  bottom: input line

*/
