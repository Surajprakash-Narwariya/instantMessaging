// const functions = require('firebase-functions');
const express = require('express');
const app = express();
const mangoose = require('mongoose');
const bodyparser = require('body-parser');
const cors = require('cors');
const loginSignup = require('./login-signup');
require('./login-signup');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');

const io = new Server(server, { cors: { origin: '*' } });

app.use(cookieParser());
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());
app.use(cors({ credentials: true }));

const port = 4000;
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

//======================SOCKET.IO=========================

const socketId = { randomUserId: '14322332' };

io.on('connection', (socket) => {
    console.log('user is connected');

    socket.on('disconnecting', () => {
        socketId[socket.id] = null;
        console.log('user is disconnected');
    });

    socket.on('private-msg', (data) => {
        socketId[data.fromUserId] = socket.id;
        const destination = socketId[data.toUserId];
        // console.log(destination);
        // console.log(data);
        socket.to(destination).emit('private-msg', {
            fromUserId: data.fromUserId,
            toUserId: data.toUserId,
            message: data.message,
        });

        // Receive message from USER and send it to DATABASE

        const chatDatabase = mangoose.model('ChatDatabase');

        const dbCode = databaseCode(data.fromUserId, data.toUserId);

        const obj = {
            fromUserId: data.fromUserId,
            toUserId: data.toUserId,
            message: data.message,
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

server.listen(process.env.PORT || 4000, () => {
    console.log('listening at port 4000');
});

// module.exports = { databaseCode };
// exports.app = functions.https.onRequest(app);
