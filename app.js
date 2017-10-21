var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");

var mongoose = require("mongoose");//chaneg the db below so its the environ one
mongoose.Promise = global.Promise; //fixes mongoose promise depreciation
var db = mongoose.connect('mongodb://heroku_2pljwfrr:e5bper0f65s64g9uijhof85baa@ds121345.mlab.com:21345/heroku_2pljwfrr');//process.env.MONGODB_URI == 'mongodb://heroku_2pljwfrr:e5bper0f65s64g9uijhof85baa@ds121345.mlab.com:21345/heroku_2pljwfrr'
var Images = require('./models/classifications');
var Users = require('./models/user');

var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 5000));//is this and above needed

app.get("/", function (req, res) {
    res.send("Deployed!");
});

// Facebook Webhook
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
            });
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
            Users.findOne({'user_id': senderId}, function(err, result){
              if (err) console.log(err);
              if (result === null){
                var newUser = new Users({
                  user_id: senderId,
                  score: 0
                }, function(err){
                  if (err) return console.log(err);
                });

                newUser.save(function(err){
                  if (err) return console.log(err);
                });
                sendMessage(senderId, {text:  greeting + "My name is Finnbot, I want to give you an easy way to classify things."});
                sendMessage(senderId, {text:  "This bot is used to help classify birds to help the Cacophony Project. You can read about what they're doing here (cacophony.org.nz)"});
                setTimeout(function(){sendInstructions(senderId).catch(function(error){
                                  console.log('something went wrong', error);
                                })}, 1000);

              } else {
                sendMessage(senderId, {text: 'Welcome back ' + name});
                sendInstructions(senderId).catch(function(error){
                  console.log('something went wrong', error);
                });
              }
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

            if (formattedMsg=='yes' || formattedMsg=='no'/* || formattedMsg=='bird' || formattedMsg=='not' || formattedMsg=='not a bird'*/) {
                processClasification(senderId, formattedMsg)
                .then(function(){
                  return sendImage(senderId); })
                .then(function(image){
                  if (image===false){
                    console.log('out of data!');
                    return sendMessage(senderId, {text:"Sorry we're out of data for you to classify. Goal achieved!", quick_replies:[
                      {
                        content_type:'text',
                        title: 'Send Again',
                        payload: 'g'//payload is needed but irrelevant
                      },
                      {
                        content_type:'text',
                        title: 'Score',
                        payload: 'g'//payload is needed but irrelevant
                      }
                    ]});
                  } else {
                    sendMessage(senderId, {text: 'Bird, yes or no?'});
                    return sendMessage(senderId, {
                        attachment:{
                          type:"image",
                          payload:{
                            url:image
                          }
                        },
                        quick_replies:[
                          {
                            content_type:'text',
                            title: 'Yes',
                            payload: 'g'//payload is needed but irrelevant
                          },{
                            content_type:'text',
                            title: 'No',
                            payload: 'g'//payload is needed but irrelevant
                          },
                          {
                            content_type:'text',
                            title: 'Skip',
                            payload: 'g'//payload is needed but irrelevant
                          },
                          {
                            content_type:'text',
                            title: 'Score',
                            payload: 'g'//payload is needed but irrelevant
                          }
                        ]
                      })
                    }
                  })
                .catch(function(error){
                  console.log('something went wrong', error);
                });
            } else if (formattedMsg=='start'){

              sendImage(senderId).then(function(image){
                if (image===false){
                  console.log('out of data!');
                  return sendMessage(senderId, {text:"Sorry we're out of data for you to classify. Goal achieved!", quick_replies:[
                    {
                      content_type:'text',
                      title: 'Send Again',
                      payload: 'g'//payload is needed but irrelevant
                    },
                    {
                      content_type:'text',
                      title: 'Score',
                      payload: 'g'//payload is needed but irrelevant
                    }
                  ]});
                } else {
                  sendMessage(senderId, {text: 'Bird, yes or no?'});
                  return sendMessage(senderId, {
                      attachment:{
                        type:"image",
                        payload:{
                          url:image
                        }
                      },
                      quick_replies:[
                        {
                          content_type:'text',
                          title: 'Yes',
                          payload: 'g'//payload is needed but irrelevant
                        },{
                          content_type:'text',
                          title: 'No',
                          payload: 'g'//payload is needed but irrelevant
                        },
                        {
                          content_type:'text',
                          title: 'Skip',
                          payload: 'g'//payload is needed but irrelevant
                        },
                        {
                          content_type:'text',
                          title: 'Score',
                          payload: 'g'//payload is needed but irrelevant
                        }
                      ]
                    })
                  }
                })
              .catch(function(error){
                console.log('something went wrong', error);
              });

            } else if (formattedMsg=='score') {

              sendUserScore(senderId).then(function(score){
                return sendMessage(senderId, {text: 'your score is ' + score, quick_replies:[
                  {
                    content_type:'text',
                    title: 'Send latest image',
                    payload: 'g'//payload is needed but irrelevant
                  }]});
              }).catch(function(error){
                console.log('something went wrong', error);
              });

            } else if (formattedMsg=='skip') {

                nextImage(senderId).then(function(image){
                    if (image===false){
                      console.log('out of data!');
                      return sendMessage(senderId, {text:"Sorry we're out of data for you to classify. Goal achieved!", quick_replies:[
                        {
                          content_type:'text',
                          title: 'Send Again',
                          payload: 'xx'
                        },
                        {
                          content_type:'text',
                          title: 'Score',
                          payload: 'g'//payload is needed but irrelevant
                        }
                      ]});
                    } else {
                      sendMessage(senderId, {text: 'Bird, yes or no?'});
                      return sendMessage(senderId, {
                        attachment:{
                          type:"image",
                          payload:{
                            url:image
                          }
                        },
                        quick_replies:[
                          {
                            content_type:'text',
                            title: 'Yes',
                            payload: 'g'//payload is needed but irrelevant
                          },{
                            content_type:'text',
                            title: 'No',
                            payload: 'g'//payload is needed but irrelevant
                          },
                          {
                            content_type:'text',
                            title: 'Skip',
                            payload: 'g'//payload is needed but irrelevant
                          },
                          {
                            content_type:'text',
                            title: 'Score',
                            payload: 'g'//payload is needed but irrelevant
                          }
                        ]
                      })
                    }
                  })
                      .catch(function(error){
                        console.log('something went wrong', error);
                      });

            } else if (formattedMsg=='undo' || formattedMsg=='redo') {

              redoLatestImage(senderId).then(function(val){
                if (val===false){
                  return sendMessage(senderId, {text: "Sorry we only keep track of your last image classified. You can't redo the image you classified before the last one that you reclassified. Pleasebe more accurate"});
                } else {
                  return sendImageAgain(senderId).then(function(image){
                    sendMessage(senderId, {text: 'Bird, yes or no?'});
                    return sendMessage(senderId, {
                      attachment:{
                        type:"image",
                        payload:{
                          url:image
                        }
                      },
                      quick_replies:[
                        {
                          content_type:'text',
                          title: 'Yes',
                          payload: 'g'//payload is needed but irrelevant
                        },{
                          content_type:'text',
                          title: 'No',
                          payload: 'g'//payload is needed but irrelevant
                        },
                        {
                          content_type:'text',
                          title: 'Skip',
                          payload: 'g'//payload is needed but irrelevant
                        },
                        {
                          content_type:'text',
                          title: 'Score',
                          payload: 'g'//payload is needed but irrelevant
                        }
                      ]
                    })
                  })
                }
              })
              .catch(function(error){
                    console.log('something went wrong', error);
                  });

            } else if (formattedMsg=='send again' || formattedMsg=='send latest image') {

                sendImageAgain(senderId).then(function(image){
                  sendMessage(senderId, {text: 'Bird, yes or no?'});
                  return sendMessage(senderId, {
                    attachment:{
                      type:"image",
                      payload:{
                        url:image
                      }
                    },
                    quick_replies:[
                      {
                        content_type:'text',
                        title: 'Yes',
                        payload: 'g'//payload is needed but irrelevant
                      },{
                        content_type:'text',
                        title: 'No',
                        payload: 'g'//payload is needed but irrelevant
                      },
                      {
                        content_type:'text',
                        title: 'Skip',
                        payload: 'g'//payload is needed but irrelevant
                      },
                      {
                        content_type:'text',
                        title: 'Score',
                        payload: 'g'//payload is needed but irrelevant
                      }
                    ]
                  })
                }).catch(function(error){
                    console.log('something went wrong', error);
                });

            } else if (formattedMsg=='instructions') {

              sendInstructions(senderId).catch(function(error){
                console.log('something went wrong', error);
              });

            } else {
                sendMessage(senderId, {
                    "attachment":{
                      "type":"image",
                      "payload":{
                        "url":"http://www.funny-animalpictures.com/media/content/items/images/funnybirds0032_O.jpg"
                      }
                    }
                  })
                return sendMessage(senderId, {text: 'Can you please say something I understand.',
                quick_replies:[
                  {
                    content_type:'text',
                    title: 'Send again',
                    payload: 'x'
                  },
                  {
                    content_type:'text',
                    title: 'Score',
                    payload: 'g'//payload is needed but irrelevant
                  }
                ]});
          }

        } else if (message.attachments) {
            sendMessage(senderId, {text: "Sorry, I don't understand your request."});
        }
      }
}

function processClasification(senderId, formattedMsg){
  //find user in user db.
  //record message type
  //get users current image
  //add one to users Score
  //make sure your last message to user was a picture
  //classify image, updating 'classifcation', 'timestamp', 'classsifier id', 'status'
  return new Promise(function(resolve, reject){
    Users.findOne({'user_id' : senderId}, 'last_message_to pending_image score last_message_from', function(err, result){
      if (err) console.log(err);
      result.last_message_from = 'classification';
      //at the moment the 'if' below is not needed since score and picture are the only messages we set
      //'lastmessageto' to. However there is room for 'potential'!
      //what if message wasnt about a picture? give them an option to see latest pic using sendimageagain
      if (result.last_message_to == 'picture' || result.last_message_to == 'score'){
        result.score += 1;
        users_current_image = result.pending_image;

        Images.update({'_id': users_current_image}, {'classification': (formattedMsg=='yes' ? true : false), 'timestamp': new Date().getTime(), 'user_id': senderId, 'status': 'classified'}, function(err){
          if (err) console.error(err);
        });

      }
      result.save(function (err) {
        if (err) {
          console.error(err);
        }
      });
      resolve();

    });

  });
}

function sendImage(senderId){
  // Get random unclassified image
  //update images status
  //update users last_message_to, last_image and pending_image
  //send image to be messaged
  return new Promise(function(resolve, reject){
    Images.count({'status': 'not classified'}).exec(function (err, count) {
      if (err) console.error(err);
      if (count !== 0){//check that count would == 0
        // Get a random entry
        var random = Math.floor(Math.random() * count);

        // Again query all images but only fetch one offset by our random #
        Images.findOne({'classification': null}).select('status image_url _id').skip(random).exec(
          function(err, result) {
            // Tada! random unclassified image 0:

            if (err) console.error(err);
            result.status = 'being classified';
            image_id = result._id;
            image_url = result.image_url
            result.save(function(err){
              if(err) {
                console.error(err);
              }
            });

            Users.findOne({'user_id': senderId}, 'pending_image last_image last_message_to', function(err, user){
                if (err) console.error(err);

                user.last_message_to = 'picture';
                user.last_image = user.pending_image;
                user.pending_image = image_id;

                user.save(function(err) {
                  if (err) {
                    console.error(err);
                  }
                });
              });

          resolve(image_url);

        });
      } else {
        resolve(false);
      }
    });
  });
}

function sendImageAgain(senderId){
  //find user in user db.
  //get users current image
  //send users current image
  return new Promise(function(resolve, reject){

    Users.findOne({'user_id': senderId}, 'pending_image last_message_to', function(err, user){
        if (err) console.error(err);

        image_id = user.pending_image;
        user.last_message_to = 'picture';
        user.last_message_from = 'resend';

        user.save(function (err) {
          if (err) {
            console.error(err);
          }
        });
        Images.findOne({'_id': mongoose.mongo.ObjectId(image_id)}, 'image_url', function(err, image){
          if (err) console.error(err);
          image_url = image.image_url
          resolve(image_url);
        })
    });
  });
}

function sendUserScore(senderId){
  //look up users 'score'
  //change users messages values
  //send score
  return new Promise(function(resolve, reject){

    Users.findOne({'user_id': senderId}, 'score pending_image last_message_to last_message_from', function(err, user){
        if (err) console.error(err);

        score = user.score;
        user.last_message_to = 'score';
        user.last_message_from = 'score';

        user.save(function (err) {
          if (err) {
            console.error(err);
          }
        });
        resolve(score);

    });
  });
}



function nextImage(senderId){
  //update pedning image's status to not classified
  //change users pending image to prevent user trying to redo a cancelled image & lastmessagefrom

  return new Promise(function(resolve, reject){
    //find users current image and get ready to update certain values
    Users.findOne({'user_id': senderId}, 'pending_image last_image last_message_from', function(err, user){
        if (err) console.error(err);

      //update users pendingimage entry in images so it's 'not classified'
      Images.findOne({'_id':  mongoose.mongo.ObjectId(user.pending_image)}, 'status', function(err, result){
        if (err) console.error(err);
        result.status = 'not classified';
        result.save(function (err) {
          if (err) {
            console.error(err);
          }
        });
      });
      //find new image for user
      Images.count({'status':'not classified', '_id': {$ne:  mongoose.mongo.ObjectId(user.pending_image)}}).exec(function (err, count) {
        if (err) console.error(err);
        if (count !== 0){
          // Get a random entry
          var random = Math.floor(Math.random() * count);

          // Again query all images but only fetch one offset by our random #
          Images.findOne({'classification': null, '_id': {$ne: mongoose.mongo.ObjectId(user.pending_image)}}).select('image_url status _id').skip(random).exec(
            function(err, result) {
              // Tada! random unclassified image 0:

              if (err) console.error(err);
              result.status = 'being classified';
              image_id = result._id;
              image_url = result.image_url
              result.save(function(err){
                if(err) {
                  console.error(err);
                }
              });

              user.pending_image = image_id;
              user.last_message_from = 'next image';
              user.save(function (err) {
                if (err) {
                  console.error(err);
                }
              });

              resolve(image_url);

            });
          } else {
            resolve(false);
          }
      });
    });
  });
}


function redoLatestImage(senderId){
  return new Promise(function(resolve, reject){
    //get usrs last image and set its status(+timestamp, classifcation, classifer id)
    //to being classified whilst setting pending image to not classified
    //get users last image and set users pending image to it.
    //set users last_image to 'redone'
    //if users last image was cancelled then obviouslythe above is irrelevant and we tell the user
    //potenital in future to allow user to redo all their images just by searching the
    //database for images classifeid by that user
    Users.findOne({'user_id': senderId}, 'pending_image last_image', function(err, user){
        if (err) console.error(err);

        if (user.last_image != 'redone'){
          Images.update({'_id':  mongoose.mongo.ObjectId(user.pending_image)}, {'status': 'not classified'}, function(err){
            if (err) console.error(err);
          });
          Images.update({'image':  mongoose.mongo.ObjectId(user.last_image)},
          {'status': 'being classified', 'classification':null, 'timestamp':null, 'user_id':null},
          function(err){
            if (err) console.error(err);
          });

          user.pending_image = user.last_image;
          user.last_image = 'redone';//make sure this doesnt cause any problems

          user.save(function (err) {
            if (err) {
              console.error(err);
            }
          });

          resolve();

        } else {
          //cant redo twice in a row on this version of classifier messenger!
          resolve(false);
        }
     });
  });
  //send usersLastLast image Now and if we want to ensure best UX then change users 'next' image in db to
  //their current image so when they're finished with the image that will be posted they will get the other
  //image they didnt get to classfiy.
  //the above is something we could do for 'potential'

}

function sendInstructions(senderId){
  return new Promise(function(resolve, reject){
    //send instructions
    //if user already ahs a pending image then offer to resend image
    sendMessage(senderId, {text: "Yes/No: To classify an image reply with 'yes' or 'no'. (In some instances we have provided buttons so you don't need to type these!)"})
    sendMessage(senderId, {text: "Undo: To undo your last classification please send 'undo'"})
    sendMessage(senderId, {text: "Score: We keep a track of how many images you have classified. To see this please send 'score'"})
    sendMessage(senderId, {text: "Skip: If you're struggling with the current image then please send 'skip' and we'll give you another one."});
    sendMessage(senderId, {text: "Send Again: If the image we last sent you is not viewable then type 'send again' and we'll send it to you again!"});
    sendMessage(senderId, {text: "Instructions: We realise this isn't the best way to learn how to use this bot. We are working on that. If you'd like to see these instructions again then just send 'instructions'"});
    Users.findOne({'user_id':senderId}, 'pending_image', function(err, result){
      if (err) console.error(err);

      if (result.pending_image === undefined){
        //user is new
        sendMessage(senderId, {text: "To start please press or send 'start'", quick_replies:[
          {
            content_type:'text',
            title: 'Start',
            payload: 'start'
          },
        ]});
        resolve();

      } else {
        sendMessage(senderId, {text: "To resend your latest image, press Send Again, else skip to another", quick_replies:[
          {
            content_type:'text',
            title: 'Send Again',
            payload: 'g'//payload is needed but irrelevant
          },
          {
            content_type:'text',
            title: 'Skip',
            payload: 'g'//payload is needed but irrelevant
          },
        ]});
        resolve();
      }
    });
  });
}


//message queing system coming up! credit to Brian. See below
//https://stackoverflow.com/questions/37152355/facebook-messenger-bot-not-sending-messages-in-order

var queue = [];
var queueProcessing = false;

function queueRequest(req) {
    queue.push(req);
    if (queueProcessing) {
        return;
    }
    queueProcessing = true;
    processQueue();
}

function processQueue() {
    if (queue.length == 0) {
        queueProcessing = false;
        return;
    }
    var currentRequest = queue.shift();

    request(currentRequest, function(error, response, body) {
        if (error || response.body.error) {
            console.log("Error sending messages!");
        }
        processQueue();
    });
}

function sendMessage(recipientId, message) {
  return new Promise(function(resolve, reject){
    req = {
        url: "https://graph.facebook.com/v2.6/me/messages",
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: "POST",
        json: {
            recipient: {id: recipientId},
            message: message,
        }
    }
    queueRequest(req)
    resolve()
  });
}
