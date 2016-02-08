var server = require('http').createServer();
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ port: 8000 });
var express = require('express');
var app = express();
var port = 8080;
var Scraper = require("image-scraper");
var request = require("request"),
    cheerio = require("cheerio");
var mongoose = require('mongoose');

// Constants & Variables
var LAST_MESSAGES_AMOUNT = 10;

// Connect to DB
mongoose.connect('mongodb://localhost:27017/Chat');

var Message = mongoose.model('Message', { 
    text: String,
    username: String,
    date: Date,
    gravatar: String
});

// Publish messages
wss.publish = function publish(data) {
    wss.clients.forEach(function each(client) {
        console.log(data);
        client.send(data);
    });
};

function receiveLastMessages(ws) {
    Message.find().sort('-date').limit(LAST_MESSAGES_AMOUNT).exec(function(err, messages){
        if (err)
            console.log("error while reading from DB");

        // create message JSON and send response to client
        ws.send(createMessages(messages));

    });
}

function storeMessage(text, username, date) {
    // Scrape for user's gravatar by username
    var address = "http://en.gravatar.com/" + username
    request(address, function (error, response, body) {
        if (!error) {
            var img;
            var $ = cheerio.load(body),
                img = $(".photo-0").attr('href');

            // message Template
            var msg = new Message({
                text: text,
                username: username,
                date: date,
                gravatar: img
            });

            // save message to store
            msg.save(function (err) {
                if (err)
                    console.log('error writing do db');
            });
            
        } else {
            console.log("We’ve encountered an error: " + error);
        }
    });
}

function createMessages(messages) {
    var msg = {
        type:       "messages",
        messages:   messages
    };

    console.log(JSON.stringify(msg));
    return JSON.stringify(msg);
}

function createMessage(text, username, date, gravatar) {
    // Template of message
    var msg = {
        type:     "message",
        text:     text,
        username: username,
        gravatar: gravatar, 
        date:     date
    };

    return JSON.stringify(msg);
};

function createSystemMessage(text) {
    // Template of message
    var msg = {
        type:     "system",
        text:     text, 
        date:     Date.now()
    };

    return JSON.stringify(msg);
}


function scrapeGravatarWithPublish(username, date, text) {

    // Scrape for user's gravatar by username
    var address = "http://en.gravatar.com/" + username
    request(address, function (error, response, body) {
        if (!error) {
            var img;
            var $ = cheerio.load(body),
                img = $(".photo-0").attr('href');

            // publish message
            wss.publish(createMessage(text, username, date, img));
            return img;
        } else {
            console.log("We’ve encountered an error: " + error);
        }
    });
};

function scrapeGravatar(username, date, text) {

    // Scrape for user's gravatar by username
    var address = "http://en.gravatar.com/" + username
    request(address, function (error, response, body) {
        if (!error) {
            var img;
            var $ = cheerio.load(body),
                img = $(".photo-0").attr('href');

            // publish message
            //wss.publish(createMessage(text, username, date, img));
            return img;
        } else {
            console.log("We’ve encountered an error: " + error);
        }
    });
};


wss.on('connection', function connection(ws) {
    ws.avatar = "";
    ws.username = "";
    var txt =  'Connection from origin ' + ws._socket.remoteAddress + ' using port: ' + ws._socket.remotePort + '.'
    console.log(txt);
    wss.publish(createSystemMessage(txt));

    ws.on('message', function incoming(message) {
        // Parse JSON message
        var msg = JSON.parse(message);

        // detect type of request
        switch(msg.type) {

            // regular message
            case "message":
                // insert array data into variables
                var type = msg.type;
                var text = msg.text;
                var username = msg.username;
                var date = Date(msg.date);
                //var avatar = scrapeGravatar(username);

                // Log message
                console.log('received message from %s with the content "%s" at date', username, text, date);

                // Insert into DB
                storeMessage(text, username, date);

                // Publish message
                scrapeGravatarWithPublish(username, date, text);
                
                break;
            // request for last messages
            case "lastmessages":
                console.log(1);
                receiveLastMessages(ws);
                break;

            case "login":
                ws.username = msg.username;
                ws.avatar = msg.avatar;
        }
    });

    ws.on('close', function close() {
        var txt =  'origin ' + ws._socket.remoteAddress + ' using port: ' + ws._socket.remotePort + '. Disconnecter'
        console.log(txt);
        wss.publish(createSystemMessage(txt));
    });
});



server.on('request', app);
server.listen(port, function () { 
    console.log('Listening on ' + server.address().port)
});
