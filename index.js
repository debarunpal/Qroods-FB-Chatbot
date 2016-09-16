'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am Tejas; chatbot at Qroods.')
})

const PAGE_ACCESS_TOKEN = "EAANfFQZBqOhEBAMCZCQFVmRFFq1g2ZCwWCZATlDc8ZC61qdC1rMwzYB08SSZAQQZAei3VJDOsRrAMiiSxuZAsGczp4pyuZCRd6gdq4hrmUJGyFLqqB2nrl7DHWUIslVelEOu6uEhm3p2SzHJBfyTh9OBjChTjFbcgIeTuTptPo9xxygZDZD"
//const token = process.env.FB_PAGE_ACCESS_TOKEN

/*
  For Facebook Verification
*/
app.get('/webhook/', function (req, res) {
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === 'my_business_is_my_identity_verify_me') {
          console.log("Validating webhook...");
          res.status(200).send(req.query['hub.challenge']);
          console.log("Webhook successfully validated.");
    } else {
          console.error("Webhook validation failed due to token mismatch.");
          res.sendStatus(403);
  }
});

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})

/*
app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i]
        let sender = event.sender.id

        if (event.message && event.message.text) {
            let text = event.message.text
            if (text === 'Generic') {
                sendGenericMessage(sender)
                continue
            }
            sendTextMessage(sender, text.substring(0, 200) + ", Welcome to Qroods. I am Tejas, your personal virtual assistant. What are you looking for today? " )
        }

        if (event.postback) {
        let text = JSON.stringify(event.postback)
        sendTextMessage(sender, text.substring(0, 200), token)
        continue
      }
    }
    res.sendStatus(200)
});
*/
app.post('/webhook/', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object == 'page') {
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function(pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function(messagingEvent) {
        if (messagingEvent.optin) {
          receivedAuthentication(messagingEvent);
        } else if (messagingEvent.message) {
          receivedMessage(messagingEvent);
        } else if (messagingEvent.delivery) {
          receivedDeliveryConfirmation(messagingEvent);
        } else if (messagingEvent.postback) {
          receivedPostback(messagingEvent);
        } else {
          console.log("Webhook received unknown messagingEvent: ", messagingEvent);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know you've
    // successfully received the callback. Otherwise, the request will time out.
    res.sendStatus(200);
  }
});

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:",
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {

    // If we receive a text message, check to see if it matches any special
    // keywords and send back the corresponding example. Otherwise, just echo
    // the text we received.
    switch (messageText) {
      case 'image':
        sendImageMessage(senderID);
        break;

      case 'button':
        sendButtonMessage(senderID);
        break;

      case 'generic':
        sendGenericMessage(senderID);
        break;

      case 'receipt':
        sendReceiptMessage(senderID);
        break;

      default:
        sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

/*
  Function sendTextMessage formats the data in the request:
*/
function sendTextMessage(recipientId, messageText) {
    var messageData = {
        recipient: {
        id: recipientId
      },
      message: {
        text: messageText
      }
    };

    callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s",
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });
}

function sendGenericMessage(senderID) {
    let messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "Place an order",
                    "subtitle": "Order your favorite clothing today",
                    "image_url": "https://cdn2.iconfinder.com/data/icons/windows-8-metro-style/512/shoping_cart.png",
                    "buttons": [{
                        "type": "web_url",
                        "url": "http://www.qroods.com/",
                        "title": "View Website"
                    }, {
                        "type": "postback",
                        "title": "Order",
                        "payload": "Your order has been successfully placed. Congrats!!!",
                    }],
                }, {
                    "title": "Track your order",
                    "subtitle": "Track your latest order",
                    "image_url": "https://cdn4.iconfinder.com/data/icons/maps-and-navigation-solid-icons-vol-3/72/111-512.png",
                    "buttons": [{
                        "type": "postback",
                        "title": "Track",
                        "payload": "Your shipment is on the way...",
                    }],
                }]
            }
        }
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}
