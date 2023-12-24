const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    userName: String,
    password: String,
    profilePicture: { 
        type: String, 
        default: '/default-picture.png' 
    }
})

const User = mongoose.model('User', userSchema)

module.exports = User