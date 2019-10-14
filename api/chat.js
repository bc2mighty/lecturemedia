const express = require("express")
const router = express.Router()
const Chat = require("../models/chat")

var Pusher = require('pusher')

var channels_client = new Pusher({
  appId: '876471',
  key: 'c3e3a775e4ef89a6824d',
  secret: '8bce1ef37f92809fbff2',
  cluster: 'eu',
  encrypted: true
})

router.post("/api/message", async(req, res) => {
    console.log(req.body)
    try{
        const chat = await Chat.create(req.body)
        console.log(chat)
        channels_client.trigger('chat-socket', 'chat-message', {
            status: -1,data: chat
        })
    }catch(e){
        console.log(e)
        res.status(400).json({status: -1,message: "Got some errors there Sir!",data: req.body})
    }
})

module.exports = router
