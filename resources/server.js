

var url = require('url');
var http = require("http");
var parser = require('./public/js/parser.js');

function parseHandler(request, response) {
    var query = url.parse(request.url, true);
    var script = "";
    request.on('data', function(data) {
        script += data;
    });
    request.on('end', function() {
        var data = parser.parseScript(script);
        response.end(JSON.stringify(data));
    });
}

var routes = {
    "/parse-script": parseHandler,
}

var server = http.createServer(function(request, response) {
    var handler = routes[request.url];
    if (handler)
        handler(request, response);
    else
        response.end("Not found you suck");
});

server.listen(3030)
