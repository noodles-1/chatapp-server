require('dotenv').config()

const express = require('express')
const app = express()
const cors = require('cors')
const { Server } = require('socket.io')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

// models
const UserConvo = require('./models/UserConvo')

mongoose.connect(process.env.MONGODB_URL)
    .catch(err => console.log(err))

const PORT = process.env.PORT
const server = app.listen(PORT, () => console.log(`listening to port ${PORT}`))

const corsConfig = {
    origin: process.env.CLIENT_URL
}

app.use(cors(corsConfig))
app.use(bodyParser.json())
app.use('/api', require('./api'))

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL
    }
})

io.on('connection', (socket) => {
    console.log(`made socket connection with ${socket.id}`)

    socket.emit('join rooms', {})
    
    socket.on('join rooms', async (data) => {
        if (!data)
            return

        const result = await UserConvo.find(
            {
                userId: new mongoose.Types.ObjectId(`${data._id}`)
            }
        )

        result.map((convo) => socket.join(convo.convoId.valueOf()))
    })

    socket.on('add to typing', data => {
        socket.broadcast.to(data.convoId).emit('add to typing', data)
    })

    socket.on('remove from typing', data => {
        socket.broadcast.to(data.convoId).emit('remove from typing', data)
    })

    socket.on('update convos', convoId => {
        io.to(convoId).emit('update convos', convoId)
    })

    socket.on('update self', _ => {
        socket.emit('update self', _)
    })

    socket.on('update user', data => {
        socket.emit('update user', data)
    })

    socket.on('join this user in room', data => {
        io.emit('join this user in room', data)
    })

    socket.on('join convo', data => {
        socket.join(data.convoId)
    })

    socket.on('leave convo', convoId => {
        socket.leave(convoId)
    })
})