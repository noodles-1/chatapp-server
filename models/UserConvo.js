const mongoose = require('mongoose')

const userConvoSchema = mongoose.Schema({
    userId: mongoose.ObjectId,
    convoId: mongoose.ObjectId
})

const UserConvo = mongoose.model('UserConvo', userConvoSchema)

module.exports = UserConvo