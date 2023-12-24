const mongoose = require('mongoose')

const chatSchema = mongoose.Schema({
    convoId: mongoose.ObjectId,
    senderId: mongoose.ObjectId,
    created: {
        type: Date,
        default: Date.now
    },
    content: String, // if announcement, either date or misc
    category: String // message or announcement
})

const Chat = mongoose.model('Chat', chatSchema)

module.exports = Chat