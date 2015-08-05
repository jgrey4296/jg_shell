var http = require('http');
var fs = require('fs');
var shell = fs.readFileSync('shell.html');

var dealWithGet = function(request,response){
    response.writeHead(200);
    if(request.url === "/"){
        response.end(shell);
    }else{
        response.end(fs.readFileSync(request.url.slice(1)));
    }
};

var dealWithPost = function(request,response){
    console.log("RECIEVED POST");
    request.on('data',function(chunk){
        console.log(chunk.toString());
    });
    response.writeHead(200,{'Content-Type':'text/plain'});
    response.end("TEST blah blah blah");
    
};

var server = http.createServer(function(request,response){
    if(request.method === "GET"){
        dealWithGet(request,response);
    }else{
        dealWithPost(request,response);
    }
});

server.listen(8888);
console.log("Server is listening");
