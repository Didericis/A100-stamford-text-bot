var twilio = require('twilio');
var nodemailer = require('nodemailer');
var qs = require('querystring');
var http = require('http');
var fs = require('fs');
var path = require('path');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var SSE = require('sse');

var twilioToken = process.env.TWILIO_TOKEN;

var server = http.createServer(function(req, res) {
    if (req.method == 'POST') {
        var body = '';

        req.on('data', function (data) {
            body += data;
        });

        req.on('end', function() {
            var postData = qs.parse(body);

            if (twilio.validateRequest(twilioToken, req.headers['x-twilio-signature'], 'https://a100-stamford-text-bot.herokuapp.com/', postData)){
                var message = postData.Body.trim();
                var to = postData.To;
                var from = postData.From

                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.write('Hi there! Message received.');
                eventEmitter.emit('wave');
                console.log('New text from ' + from);
                console.log('"' + message + '"');

                res.end();
            } else {
                console.log('INVALID REQUEST');
                sendResponse(res, '403', 'text/plain', 403);
            }
        });
    } else if (req.method == 'GET') {
        var filePath;

        if (req.url == '/') {
            filePath = '/index.html';
        } else {
            filePath = req.url;
        }

        sendFile(res, filePath);
    }
});

server.listen(process.env.PORT, function(){
    var sse = new SSE(server);
    sse.on('connection', function(client){
        eventEmitter.on('wave', function(){
            client.send('wave');
        });
    });
});

function sendFile(res, filePath, code){
    fs.readFile('.' + filePath, function(err, file){
        if (err && err.code == 'ENOENT') {
            if (code == 500) {
                sendResponse(res, '500', 'text/plain', 500);
            } else if (code == 404) {
                sendResponse(res, '404', 'text/plain', 404);
            } else { 
                sendFile(res, '/404.html', 404);
            }
        } else if (err) {
            sendFile(res, '/500.html', 500);
        } else if (code) {
            sendFile(res, filePath, code);
        } else if (path.extname(filePath) == '.html') {
            sendResponse(res, file, 'text/html', 200);
        } else if (path.extname(filePath) == '.css') {
            sendResponse(res, file, 'text/css', 200);
        } else if (path.extname(filePath) == '.js') {
            sendResponse(res, file, 'application/javascript', 200);
        } else if (path.extname(filePath) == '.png') {
            sendResponse(res, file, 'image/png', 200);
        } else if (path.extname(filePath) == '.ico') {
            sendResponse(res, file, 'image/x-icon', 200);
        } else if (path.extname(filePath) == '.mp3') {
            sendResponse(res, file, 'audio/mpeg', 200);
        } else {
            sendResponse(res, 'Unsupported file type', 'text/plain', 415); 
        }
    }); 
}

function sendResponse(res, file, fileType, code){
    res.writeHead(code, {'Content-Type': fileType});
    res.end(file);
}
