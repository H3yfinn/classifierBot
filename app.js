var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var User = require('./models/user');
//var db = mongoose.connect(process.env.MONGODB_URI);
//var Movie = require("./models/movie");

var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 5000));

// Server index page
app.get("/", function (req, res) {
    res.send("Deployed!");
});

// Facebook Webhook
// Used for verification
app.get("/webhook", function (req, res) {
    if (req.query["hub.verify_token"] === process.env.VERIFICATION_TOKEN) {
        console.log("Verified webhook");
        res.status(200).send(req.query["hub.challenge"]);
    } else {
        console.error("Verification failed. The tokens do not match.");
        res.sendStatus(403);
    }
});

// All callbacks for Messenger will be POST-ed here
app.post("/webhook", function (req, res) {
    // Make sure this is a page subscription
    if (req.body.object == "page") {
        // Iterate over each entry
        // There may be multiple entries if batched
        req.body.entry.forEach(function(entry) {
            // Iterate over each messaging event
            entry.messaging.forEach(function(event) {
                if (event.postback) {
                    processPostback(event);
                } else if (event.message) {
                    processMessage(event);
                }
            });//functionality here to indicayted whtehr its a lend or borow
        });

        res.sendStatus(200);
    }
});

function processPostback(event) {
    var senderId = event.sender.id;
    var payload = event.postback.payload;

    if (payload === "Greeting") {
        // Get user's first name from the User Profile API
        // and include it in the greeting
        request({
            url: "https://graph.facebook.com/v2.6/" + senderId,
            qs: {
                access_token: process.env.PAGE_ACCESS_TOKEN,
                fields: "first_name"
            },
            method: "GET"
        }, function(error, response, body) {
            var greeting = "";
            if (error) {
                console.log("Error getting user's name: " +  error);
            } else {
                var bodyObj = JSON.parse(body);
                name = bodyObj.first_name;
                greeting = "Hi " + name + ". ";
            }
            var message = greeting + "My name is Finnbot, I'm here to track how much you lend to and owe people, kind of like a personal accountant but free! - and way way smarter (;";
            sendMessage(senderId, {text: message});
            sendMessage(senderId, {text: 'Are you going to record how much you have borrowed from or lent someone?',
              quick_replies:[
                {
                  content_type:'text',
                  title: 'Lend',
                  payload: 'LEND'//not needed atm
                },
                {
                  content_type: 'text',
                  title: 'Borrow',
                  payload: 'BORROW'
                }
              ]
            });
          });
    }
}

function processMessage(event) {
    if (!event.message.is_echo) {
        var message = event.message;
        var senderId = event.sender.id;

        console.log("Received message from senderId: " + senderId);
        console.log("Message is: " + JSON.stringify(message));

        // You may get a text or attachment but not both
        if (message.text) {
            var formattedMsg = message.text.toLowerCase().trim();
            if (formattedMsg=='lend') {
                requestLendAmount(senderId);
            } else if (formattedMsg=='borrow') {
                requestBorrowAmount(senderId);
            } else if (formattedMsg=='undo') {
                deleteLatestObject(senderId);
            } else if (!isNaN(formattedMsg)) {
                recordLendAmount(senderId, formattedMsg);
                recordBorrowAmount(senderId, formattedMsg);
            } else {
                recordName(senderId, formattedMsg);
            }
        } else if (message.attachments) {
            sendMessage(senderId, {
              text: "Sorry, I don't understand your request.",
              quick_replies:[
                {
                  content_type:'text',
                  title: 'Red',
                  payload: 'gg'
                }]
              });
        }
    }
}

function deleteLatestObject(senderId){
    sendMessage(senderId, {text:"We've reset your latest entry"})//will this remove entries in database as well? Important that transparency is ahceived
}
function requestLendAmount(senderId) {
    sendMessage(senderId, {text: 'Cool, how much did you lend?'});//possobility to add the most used people as quick replies
}//the rply to this should come with a payload indicating its a name and then the same for money

function requestBorrowAmount(senderId) {
    sendMessage(senderId, {text: 'Cool, how much did you borrow?'});
}

function recordLendAmount(senderId, formattedMsg){
    var senderId = senderId; //what elese can i get form the sender? and is senderid  constant?
    var amount = formattedMsg;
    User.find({user_id: senderId }).exec(function(err, result) {
          if (!err) {
            //insert amount as lend or borrow
            User.lends.push({ lendId: mongoose.Types.ObjectId, created_at: new Date(), amount: amount});//not sure if object id is right there, reason and name to be added later?
          } else {
              console.log(err)
              var newUser = new User({
                user_id: senderId,
                lends: [{
                  lendId: mongoose.Types.ObjectId, created_at: new Date(), amount: amount
                }],
                borrows: [{}]
            })
          };
        });

    sendMessage(senderId, {text: "Awesome! Who did you lend this to?"});
}

//possobility to add the most used people as quick replies
//the rply to this should come with a payload indicating it's a name and then the same for money

function recordBorrowAmount(senderId) {
    sendMessage(senderId, {text: '"Awesome! Who did you lend this to?"'});
}
function recordName(senderId, formattedMsg){
    sendMessage(senderId, {text: "Thanks for that. Everything is recorded. Use the buttons below to choose your next action"});
}
// sends message to user
function sendMessage(recipientId, message) {
    request({
        url: "https://graph.facebook.com/v2.6/me/messages",
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: "POST",
        json: {
            recipient: {id: recipientId},
            message: message,
        }
    }, function(error, response, body) {
        if (error) {
            console.log("Error sending message: " + response.error);
        }
    });
}
