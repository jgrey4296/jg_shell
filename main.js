process.stdin.setEncoding('utf8')

var Shell = require('./src/shell');

var theShell = new Shell();

var commands = {
    "mkdir" : function(sh,values){
        sh.mkdir(values[0],values.slice(1));
    },
    "cd" : function(sh,values){
        sh.changeDir(values[0]);
    },
    "pwd" : function(sh,values){
        sh.pwd();
    },
    "rm" : function(sh,values){
        console.log("TODO: rm");
    },
    "ls" : function(sh,values){
        sh.ls(values);
    }
};

console.log(commands);

process.stdin.on('readable',function(){
    var line = process.stdin.read();
    if (line !== null){
        var splitLine = line.trim().split(" ");
        var command = commands[splitLine[0]];
        if (command !== undefined){
            command(theShell,splitLine.slice(1));
        }else{
            console.log("unrecognised command: " + splitLine[0]);
        }
    }
    

});
