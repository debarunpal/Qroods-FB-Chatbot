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

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_business_is_my_identity_verify_me') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})

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
})

const token = "EAANfFQZBqOhEBAMCZCQFVmRFFq1g2ZCwWCZATlDc8ZC61qdC1rMwzYB08SSZAQQZAei3VJDOsRrAMiiSxuZAsGczp4pyuZCRd6gdq4hrmUJGyFLqqB2nrl7DHWUIslVelEOu6uEhm3p2SzHJBfyTh9OBjChTjFbcgIeTuTptPo9xxygZDZD"
//const token = process.env.FB_PAGE_ACCESS_TOKEN

function sendTextMessage(sender, text) {
    let messageData = { text:text }
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

function sendGenericMessage(sender) {
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
                        "title": "Visit our Website"
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
