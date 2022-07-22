// const functions = require('firebase-functions');
const express = require('express');
const app = express();
const mangoose = require('mongoose');
const bodyparser = require('body-parser');
const cors = require('cors');
const loginSignup = require('./login-signup');
const imageUpload = require('./imageUpload');
const route = require('./route');
const cookieParser = require('cookie-parser');
require('dotenv').config();
// const port = 4000 || process.env.PORT;

const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const { builtinModules } = require('module');

const io = new Server(server, { cors: { origin: '*' } });

app.use(cookieParser());
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

app.use(
    cors({
        origin: ['http://localhost:3000', 'https://quickchat-81832.web.app'],
        credentials: true,
        exposedHeaders: ['jwt', 'name', 'email', 'userId', 'imageAddress'],
    })
);

const password = process.env.DB_PASSWORD;
const myFirstDatabase = process.env.MY_FIRST_DATABASE;

//$$$$$$$$$$$$$$$$$$$$$$$$ Contains - DatabaseSchema and SOCKET.IO $$$$$$$$$$$$$$$$$$$$$$$$$$$$$

//===========================Database Code================================
function databaseCode(userId1, userId2) {
    if (userId1 > userId2) {
        return userId2.concat(userId1);
    } else {
        return userId1.concat(userId2);
    }
}

// Connection with DATABASE ------------------------------------------

mangoose.connect(
    `mongodb+srv://suraj:${password}@encryptedmessaging.r3mld.mongodb.net/${myFirstDatabase}?retryWrites=true&w=majority`,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }
);

const UserSchema = new mangoose.Schema({
    userId: String,
    name: String,
    email: { type: String, required: true },
    password: { type: String, required: true },
    imageAddress: { type: String },
    contacts: { type: Array },
});
const user = mangoose.model('User', UserSchema);

const ChatDatabaseSchema = new mangoose.Schema({
    dbCode: String,

    chats: [
        {
            fromUserId: String,
            toUserId: String,
            message: String,
            time: String,
        },
    ],
});
const chatDatabase = mangoose.model('ChatDatabase', ChatDatabaseSchema);

// Backend Routes --------------------------------------------------
// app.get('/', (req, res) => {
//     res.send('Hello World!');
//     // console.log(req.ip);
// });

// MIDDLE WARE ROUTES
app.use('', loginSignup);
app.use('', route);
app.use('', imageUpload);

//======================SOCKET.IO=========================

const socketId = { randomUserId: '14322332' }; // socketId[ userId ] = socket.id
const userIdentity = { socId: 'userID' }; // userIdentity[ socket.id ] = userId

io.on('connection', (socket) => {
    console.log('user is connected');

    socket.on('login', (data) => {
        // console.log(data.user);
        socketId[data.user] = socket.id;
        userIdentity[socket.id] = data.user;
    });

    socket.on('disconnecting', () => {
        // socketId[socket.id] = null;
        const userId = userIdentity[socket.id];
        delete socketId[userId];
        delete userIdentity[socket.id];

        console.log('user is disconnected');
    });

    // Getting Online status in chat.js

    socket.on('is-online', (data) => {
        const { userId, sendTo } = data;
        // console.log(userId + ' ' + sendTo);

        const destination = socketId[sendTo];
        // console.log(destination);
        // socket.to(destination).emit('is-online', {
        //     isOnline: false,
        // });
        if (socketId[userId]) {
            socket.emit('is-online', {
                isOnline: true,
            });
        } else {
            socket.emit('is-online', {
                isOnline: false,
            });
        }
    });

    socket.on('private-msg', (data) => {
        socketId[data.fromUserId] = socket.id;
        const destination = socketId[data.toUserId];
        // console.log('desit' + destination);
        // console.log(data);
        socket.to(destination).emit('private-msg', {
            fromUserId: data.fromUserId,
            toUserId: data.toUserId,
            message: data.message,
            time: data.time,
        });

        // Receive message from USER and send it to DATABASE

        const chatDatabase = mangoose.model('ChatDatabase');

        const dbCode = databaseCode(data.fromUserId, data.toUserId);

        const obj = {
            fromUserId: data.fromUserId,
            toUserId: data.toUserId,
            message: data.message,
            time: data.time,
        };

        chatDatabase.findOneAndUpdate(
            { dbCode: dbCode },
            {
                $push: { chats: obj },
            },
            { new: true },
            (err, docs) => {
                console.log(err);
                // console.log(docs);
            }
        );
    });
});

app.post('/isOnline', (req, res) => {
    const userId = req.body.userId;
    if (socketId[userId] !== null) {
        res.send({ online: true });
    } else {
        res.send({ online: false });
    }
});

app.get('/socketid', (req, res) => {
    res.send({ soc: socketId, use: userIdentity });
});

server.listen(process.env.PORT || 4000, () => {
    console.log('listening at port 4000');
});

module.exports.databaseCode = databaseCode;
// module.exports = { databaseCode };
// exports.databaseCode = databaseCode;
// module.exports = databaseCode;
