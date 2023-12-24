const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')

// models
const User = require('./models/User')
const Convo = require('./models/Convo')
const Chat = require('./models/Chat')
const UserConvo = require('./models/UserConvo')
const ChatSeen = require('./models/ChatSeen')

// GET requests
router.get('/get-convo/:id', async (req, res) => {
    try {
        const result = await Convo.findOne(
            {
                _id: new mongoose.Types.ObjectId(`${req.params.id}`)
            }
        )

        res.json(result)
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.get('/get-chat-list/:id', async (req, res) => {
    try {
        const result = await User.aggregate([
            {
                $match: {
                    '_id': new mongoose.Types.ObjectId(`${req.params.id}`)
                }
            },
            {
                $lookup: {
                    from: UserConvo.collection.name,
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'userConvos'
                }
            },
            {
                $unwind: {
                    path: '$userConvos',
                    preserveNullAndEmptyArrays: false
                }
            },
            {
                $lookup: {
                    from: Convo.collection.name,
                    localField: 'userConvos.convoId',
                    foreignField: '_id',
                    as: 'convos'
                }
            },
            {
                $unwind: {
                    path: '$convos',
                    preserveNullAndEmptyArrays: false
                }
            },
            {
                $lookup: {
                    from: Chat.collection.name,
                    localField: 'convos._id',
                    foreignField: 'convoId',
                    as: 'chats',
                    pipeline: [
                        {
                            $sort: { 'created': -1 }
                        },
                        {
                            $lookup: {
                                from: User.collection.name,
                                localField: 'senderId',
                                foreignField: '_id',
                                as: 'user'
                            }
                        },
                        {
                            $limit: 1
                        }
                    ]
                },
            }
        ])

        res.send(result)
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.get('/get-search-chat-list/:id/:query', async (req, res) => {
    try {
        const decoded = decodeURIComponent(req.params.query)
        const regex = new RegExp(decoded, 'i')

        const result = await User.aggregate([
            {
                $match: {
                    '_id': new mongoose.Types.ObjectId(`${req.params.id}`)
                }
            },
            {
                $lookup: {
                    from: UserConvo.collection.name,
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'userConvos'
                }
            },
            {
                $unwind: {
                    path: '$userConvos',
                    preserveNullAndEmptyArrays: false
                }
            },
            {
                $lookup: {
                    from: Convo.collection.name,
                    localField: 'userConvos.convoId',
                    foreignField: '_id',
                    as: 'convos'
                }
            },
            {
                $unwind: {
                    path: '$convos',
                    preserveNullAndEmptyArrays: false
                }
            },
            {
                $match: {
                    'convos.convoName': { $regex: regex }
                }
            },
            {
                $lookup: {
                    from: Chat.collection.name,
                    localField: 'convos._id',
                    foreignField: 'convoId',
                    as: 'chats',
                    pipeline: [
                        {
                            $sort: { 'created': -1 }
                        },
                        {
                            $lookup: {
                                from: User.collection.name,
                                localField: 'senderId',
                                foreignField: '_id',
                                as: 'user'
                            }
                        },
                        {
                            $limit: 1
                        }
                    ]
                },
            }
        ])

        res.send(result)
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.get('/get-chats/:id/:page', async (req, res) => {
    try {
        const page = parseInt(req.params.page)
        const limit = 25

        const result = await Convo.aggregate([
            {
                $match: {
                    '_id': new mongoose.Types.ObjectId(`${req.params.id}`)
                }
            },
            {
                $lookup: {
                    from: Chat.collection.name,
                    localField: '_id',
                    foreignField: 'convoId',
                    as: 'convoChats',
                    pipeline: [
                        {
                            $sort: { 'created': -1 }
                        },
                        {
                            $lookup: {
                                from: User.collection.name,
                                localField: 'senderId',
                                foreignField: '_id',
                                as: 'user'
                            }
                        },
                        {
                            $skip: page * limit
                        },
                        {
                            $limit: limit
                        }
                    ]
                }
            }
        ])

        result[0].next = result[0].convoChats.length < limit ? null : page + 1
        res.send(result[0])
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.get('/get-seen/:userId/:chatId', async (req, res) => {
    try {
        const result = await ChatSeen.find(
            {
                chatId: new mongoose.Types.ObjectId(`${req.params.chatId}`),
                viewerId: new mongoose.Types.ObjectId(`${req.params.userId}`)
            }
        )
                
        res.send(result.length > 0)
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.get('/get-convo-members/:id', async (req, res) => {
    try {
        const result = await UserConvo.aggregate([
            {
                $match: {
                    'convoId': new mongoose.Types.ObjectId(`${req.params.id}`)
                }
            },
            {
                $lookup: {
                    from: User.collection.name,
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'convoMembers'
                }
            },
            {
                $sort: {
                    'fullName': 1
                }
            }
        ])

        res.send(result)
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.get('/get-non-members/:convoId', async (req, res) => {
    try {
        const membersResult = await UserConvo.find(
            {
                convoId: new mongoose.Types.ObjectId(`${req.params.convoId}`)
            }
        )

        const members = membersResult.map((elem) => elem.userId)

        const nonMembersResult = await User.find(
            {
                _id: {
                    $nin: members
                }
            }
        )

        res.send(nonMembersResult)
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.get('/check-in-convo/:convoId/:userId', async (req, res) => {
    try {
        const result = await UserConvo.find(
            {
                userId: new mongoose.Types.ObjectId(`${req.params.userId}`),
                convoId: new mongoose.Types.ObjectId(`${req.params.convoId}`)
            }
        )

        res.send(result)
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.get('/get-users/:userId', async (req, res) => {
    try {
        const result = await User.find(
            {
                _id: { $ne: new mongoose.Types.ObjectId(`${req.params.userId}`) }
            }
        )
        res.send(result)
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.get('/check-same-users-in-convo/:userIds', async (req, res) => {
    try {
        const users = JSON.parse(req.params.userIds).map((user) => new mongoose.Types.ObjectId(`${user.value}`))

        const result = await UserConvo.aggregate([
            {
                $group: {
                    _id: "$convoId",
                    members: { $addToSet: "$userId" },
                    count: { $sum: 1 }
                }
            },
            {
                $match: {
                    members: { $all: users },
                    count: users.length
                }
            }
        ])

        res.send(result)
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.get('/check-username-existing/:userName', async (req, res) => {
    try {
        const result = await User.find(
            {
                userName: req.params.userName
            }
        )

        res.send(result)
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.get('/get-user/:userId', async (req, res) => {
    try {
        const result = await User.findOne(
            {
                _id: req.params.userId
            }
        )

        res.send(result)
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})


// POST requests
router.post('/register', async (req, res) => {
    try {
        await User.create(
            {
                userName: req.body.userName,
                password: req.body.password,
                profilePicture: req.body.profilePicture
            }
        )

        res.sendStatus(200)
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.post('/login', async (req, res) => {
    try {
        const result = await User.find(
            {
                userName: req.body.userName
            }
        )

        res.send(result)
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.post('/send-message', async (req, res) => {
    try {
        await Chat.create(
            {
                convoId: new mongoose.Types.ObjectId(`${req.body.convoId}`),
                senderId: new mongoose.Types.ObjectId(`${req.body.senderId}`),
                content: req.body.content,
                category: req.body.category
            }
        )
        
        res.sendStatus(200)
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.post('/chat-seen', async (req, res) => {
    try {
        const result = await ChatSeen.findOne(
            {
                chatId: new mongoose.Types.ObjectId(`${req.body.chatId}`),
                viewerId: req.body.viewerId
            }
        )

        if (!result) {
            ChatSeen.create(
                {
                    chatId: new mongoose.Types.ObjectId(`${req.body.chatId}`),
                    viewerId: req.body.viewerId
                }
            )
        }
        
        res.sendStatus(200)
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.post('/set-convo-name', async (req, res) => {
    try {
        await Convo.findOneAndUpdate(
            {
                _id: new mongoose.Types.ObjectId(`${req.body.convoId}`)
            },
            {
                convoName: req.body.newName
            }
        )

        res.sendStatus(200)
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.post('/add-members-convo', (req, res) => {
    try {
        req.body.members.map((member) => {
            UserConvo.create(
                {
                    userId: new mongoose.Types.ObjectId(`${member.value}`),
                    convoId: new mongoose.Types.ObjectId(`${req.body.convoId}`)
                }
            )
        })

        res.sendStatus(200)
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.post('/leave-convo', async (req, res) => {
    try {
        await UserConvo.deleteOne(
            {
                userId: new mongoose.Types.ObjectId(`${req.body.userId}`),
                convoId: new mongoose.Types.ObjectId(`${req.body.convoId}`)
            }
        )

        res.sendStatus(200)
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.post('/create-convo', async (req, res) => {
    try {
        const newConvoResult = await Convo.create(
            {
                convoName: req.body.convoName,
                convoPicture: req.body.convoPicture
            }
        )

        res.send(newConvoResult)
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.post('/update-profile-picture', async (req, res) => {
    try {
        await User.findOneAndUpdate(
            {
                _id: new mongoose.Types.ObjectId(`${req.body.userId}`)
            },
            {
                profilePicture: req.body.profilePicture
            }
        )

        res.sendStatus(200)
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.post('/update-convo-picture', async (req, res) => {
    try {
        await Convo.findOneAndUpdate(
            {
                _id: req.body.convoId
            },
            {
                convoPicture: req.body.convoPicture
            }
        )

        res.sendStatus(200)
    }
    catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})


module.exports = router