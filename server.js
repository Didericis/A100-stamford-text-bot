var twilio = require('twilio');
var nodemailer = require('nodemailer');
var qs = require('querystring');
var http = require('http');
var fs = require('fs');
var path = require('path');
var events = require('events');
var SSE = require('sse');

var TWILIO_TOKEN = process.env.TWILIO_TOKEN;
var EMAIL_ADMIN = process.env.EMAIL_ADMIN;
var EMAIL_USER = process.env.EMAIL_USER;
var EMAIL_PASS = process.env.EMAIL_PASS;
var FOLDER_CLIENT = 'client';
var FOLDER_IMG = 'img';
var FILE_NICKNAME = './nicknames.json';
var COMMAND = {
    NICKNAME : 'nickname'
}

var nicknameLock = false;
var nicknames = getJson(FILE_NICKNAME);
var eventEmitter = new events.EventEmitter();
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    }
});
var server = http.createServer(function(req, res) {
    if (req.method == 'POST') {
        interpretPost(req, res);
    } else if (req.method == 'GET') {
        interpretGet(req, res);
    }
});
var userConversationState = {};

server.listen(process.env.PORT, function(){
    var sse = new SSE(server);
    sse.on('connection', function(client){
        eventEmitter.on('wave', function(){
            client.send('wave');
        });
    });
});

function interpretGet(req, res){
    var filePath;

    if (req.url == '/') {
        filePath = path.join(FOLDER_CLIENT, 'index.html');
    } else if (isFavicon(req.url)) {
        filePath = path.join(FOLDER_CLIENT, FOLDER_IMG, path.basename(req.url));
    } else {
        filePath = path.join(FOLDER_CLIENT, req.url);
    }

    sendFile(res, filePath);
}

function interpretPost(req, res){
    var body = '';

    req.on('data', function (data) {
        body += data;
    });

    req.on('end', function() {
        var postData = qs.parse(body);
        respondToPost(postData, req, res);
    });    
}

function respondToPost(postData, req, res){
    if (postData && isTwilio(req, postData)){
        var message = {         //Strips out unnecessary post data
            body: postData.Body || '',
            to: postData.To || '',
            from: postData.From || ''
        }
        respondToMessage(message, res);
    } else {
        console.log('INVALID REQUEST');
        sendResponse(res, '403', 'text/plain', 403);
    }    
}

function respondToMessage(message, res){
    var command = message.body.split(' ')[0].toLowerCase();
    var param = message.body.split(' ')[1];

    switch(command){
        case COMMAND.NICKNAME:
            setNickname(message.from, param, res);
        default:
            forwardMessage(message, res);
    }
}

function forwardMessage(message, res){
    var senderNickname = nicknames[message.from];
    var mailOptions = {
        from: senderNickname || message.from,
        to: EMAIL_ADMIN,
        subject: 'New Message',
        text: message.body
    };
    // transporter.sendMail(mailOptions, function(err, info){
        if (false) {
            console.log(err);
        } else if (senderNickname){
            eventEmitter.emit('wave', res);
            sendTextResponse('Hey ' + senderNickname + '! Message received.', res);
        } else {
            eventEmitter.emit('wave', res);
            sendTextResponse('Message received.', res);
        }
    // });
}

function sendFile(res, filePath, code){
    fs.readFile(filePath, function(err, file){
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

function setNickname(number, nickname, res){
    nicknames[number] = nickname;
    if (!nicknameLock) {
        nicknameLock = true;
        fs.writeFile(FILE_NICKNAME, JSON.stringify(nicknames), function(err){
            nicknameLock = false;
            if (err) console.log(err);
        });
    }
    sendTextResponse('You will now be reffered to as "' + nickname + '"', res);
}

function sendTextResponse(message, res){
    sendResponse(res, message, 'text/plain', 200); 
}

function sendResponse(res, file, fileType, code){
    res.writeHead(code, {'Content-Type': fileType});
    res.end(file);
}

function isFavicon(url){
    return path.basename(url).indexOf('favicon') == 0;
}

function isTwilio(req, postData){
    return true;
    return twilio.validateRequest(TWILIO_TOKEN, req.headers['x-twilio-signature'], 'https://a100-stamford-text-bot.herokuapp.com/', postData);
}

function getJson(fileName){
    try {
        return require(fileName);
    } catch(e) {
        fs.writeFileSync(fileName, '{}');
        return {};
    }
}
