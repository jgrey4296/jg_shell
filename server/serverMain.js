var http = require('http');
var fs = require('fs');
var shell = fs.readFileSync('shell.html');
var path = require('path');

//Supported File extensions -> mimetype
var extensions = {
    ".html" : "text/html",
    ".css" : "text/css",
    ".js" : "application/javascript",
    ".png" : "image/png",
    ".gif" : "image/gif",
    ".jpg" : "image/jpeg",
    ".json": "application/json",
};

//Function for GET messages
var dealWithGet = function(request,response){
    var fileName = path.basename(request.url) || 'shell.html';
    var dirName = path.dirname(request.url);
    var ext = path.extname(fileName);
    var filePath = path.join(".",dirName,fileName);

    console.log("Getting:",filePath);
    
    //Unsupported file
    if(!extensions[ext]){
        response.writeHead(404,{"Content-Type":"text/html"});
        response.end("&lt;html&gt;&lt;head&gt;&lt;/head&gt;&lt;body&gt;The requested file type is not supported&lt;/body&gt;&lt;/html&gt;");
        return;
    }

    //Otherwise:
    console.log("Opening: ", filePath);
    fs.exists(filePath,function(exists){
        if(exists){
            fs.readFile(filePath,function(err,contents){
                if(!err){
                    response.writeHead(200,{
                        "Content-type":extensions[ext],
                        "Content-Length":contents.length
                    });
                    response.end(contents);
                }else{
                    console.log(err);
                }

            });
        }else{
            response.writeHead(404,{'Content-Type':'text/html'});
            response.end("The requested file was not found: " + filePath);
        }
    });    
};

//function for POST messages
var dealWithPost = function(request,response){
    console.log("RECIEVED POST:",request.url);
    var values = request.url.split("=");

    //Instruction to save data:
    //using url for save instruction and filename.
    if(values[0].slice(1) === "saveData"){
        console.log("Saving to File:",values[1]+".json");
        //aggregate recieved post data
        var allData = "";
        request.on('data',function(chunk){
            allData += chunk;
        });

        //when aggregated, save it to file
        request.on('end',function(){
            console.log("Entire Message received:",allData);
            fs.writeFile("./data/"+values[1]+".json",allData,function(err){
                if(err){
                    console.log("Error:",err);
                    response.writeHead(404);
                    response.end();
                }else{
                    //Respond with something
                    response.writeHead(200,{'Content-Type':'text/plain'});
                    response.end("");
                }
            });
        });
    }
};

//----------------------------------------
//The server itself
var server = http.createServer(function(request,response){
    if(request.method === "GET"){
        dealWithGet(request,response);
    }else{
        dealWithPost(request,response);
    }
});
server.listen(8888);//Run the server
console.log("Simple Shell Server is listening");
