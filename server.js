var twilio = require('twilio');
var nodemailer = require('nodemailer');
var qs= require('querystring');
var http = require('http');

var twilioToken = process.env.TWILIO_TOKEN;

http.createServer(function(req, res) {
    if (req.method == 'POST') {
        var body = '';

        req.on('data', function (data) {
            body += data;
        });

        req.on('end', function() {
            var postData = qs.parse(body);

            if (twilio.validateRequest(twilioToken, req.headers['x-twilio-signature'], 'http://67.83.190.74:3555/', postData)){
                var message = postData.Body.trim();
                var to = postData.To;
                var from = postData.From
                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.write('Working');
                
                console.log('New text from ' + from);
                console.log('"' + message + '"');
                // forwardSms(body);
                res.end();
            } else {
                console.log('INVALID REQUEST');
                res.writeHead(403, 'Forbidden', {'Content-Type': 'text/html'});
                res.end();
            }
        });
    }
}).listen(3555);

//http.createServer(function(req, res) {
//    res.writeHead(200, {'Content-Type': 'text/html'});
//    res.end('<html><body>HI</body></html>');
//}).listen(80);

//routes['/twilio'] = function(req, res) {
//    if (twilio.validateExpressRequest(req, config.authToken)) {
//        res.writeHead(200, {'Content-Type': 'text/plain'});
//            res.send("sweet!");
//        };
//    }
//}
