const mongoose = require('mongoose')

const chatSeenSchema = mongoose.Schema({
    chatId: mongoose.ObjectId,
    viewerId: mongoose.ObjectId
})

const ChatSeen = mongoose.model('ChatSeen', chatSeenSchema)

module.exports = ChatSeen