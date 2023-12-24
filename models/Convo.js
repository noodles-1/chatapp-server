const mongoose = require('mongoose')

const convoSchema = mongoose.Schema({
    convoName: String,
    convoPicture: {
        type: String,
        default: '/default-chat-picture.png'
    }
})

const Convo = mongoose.model('Convo', convoSchema)

module.exports = Convo