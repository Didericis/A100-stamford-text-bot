var twilio = require('twilio');
var nodemailer = require('nodemailer');

var http = require('http');
var twilioToken = process.env.TWILIO_TOKEN;

http.createServer(function(req, res) {
    if (twilio.validateExpressRequest(req, twilioToken, {url: config.webhook})) {
        res.writeHead(200, {'Content-Type': 'text/xml'});
        var body = req.param('Body').trim();
        var to = req.param('To');
        var from = req.param('From');
        console.log(body);
        // forwardSms(body);
        res.end();
    }
    else {
        res.writeHead(403, 'Forbidden', {'Content-Type': 'text/html'});
        res.end();
    }
}).listen(3555);

http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('<html><body>HI</body></html>');
}).listen(80);

//routes['/twilio'] = function(req, res) {
//    if (twilio.validateExpressRequest(req, config.authToken)) {
//        res.writeHead(200, {'Content-Type': 'text/plain'});
//            res.send("sweet!");
//        };
//    }
//}
