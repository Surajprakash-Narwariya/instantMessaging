const express = require('express');
const router = express.Router();
const mangoose = require('mongoose');
const { generateAccessToken, authenticateToken } = require('./jsonWebToken.js');
const { RemoteSocket } = require('socket.io');
const {
    hash,
    encryptionKey,
    encryptPrivateKey,
    decryptPrivateKey,
} = require('./crypto');

require('./app.js');

function databaseCode(userId1, userId2) {
    if (userId1 > userId2) {
        return userId2.concat(userId1);
    } else {
        return userId1.concat(userId2);
    }
}

//----------------------------------------------------
//=============================for path = /profile ========================
router.get('/profile', authenticateToken, (req, res) => {
    res.send('Authenticated');
});

router.get('/test', (req, res) => {
    res.send('Custom Message => Deployed Successfully');
});

//===============================for deleting data ===========================

router.post('/delete', authenticateToken, (req, res) => {
    var X = mangoose.model('User');
    // console.log(req.body.userId);

    X.remove({ userId: req.body.userId })
        .then((docs) => {
            if (docs) {
                res.send({ success: true, data: docs });
                // console.log('success');
            } else {
                reject({ success: false, data: 'no such user exist' });
            }
        })
        .catch((err) => {
            reject(err);
        });
});

//------------------------------------ for path = /Signup -------------------
router.post('/signup', (req, res) => {
    var X = mangoose.model('User');

    const hashPass = hash(req.body.password);
    // console.log(hashPass);

    X.find({ userId: req.body.userId }, async (err, docs) => {
        if (docs.length === 0) {
            // creating encryption public and private key
            const encryptionkey = await encryptionKey(req.body.userId);

            const { privateKey, publicKey } = encryptionkey;
            console.log(privateKey);
            // encrypt private key with hash of password
            // const encryPrivateKey = encryptPrivateKey(privateKey, hashPass);

            const newUser = new X({
                userId: req.body.userId,
                name: req.body.name,
                email: req.body.email,
                privateKey: privateKey,
                publicKey: publicKey,
                password: hashPass,
                imageAddress: '',
                contacts: [],
            });
            newUser.save().then(() => console.log('user is created'));

            res.send('Success');
        } else {
            res.send(`Username ${req.body.userId} already exists`);
        }
    });
});

//--------------------------------------- for path = "/login" -------------------
router.post('/login', (req, res) => {
    // take the request and check it from the database
    var X = mangoose.model('User');

    const uId = req.body.userId;
    const pass = req.body.password;

    const hashPass = hash(pass);
    // console.log(hashPass);

    // Checking if the userId exists
    X.find({ userId: uId }, (err, docs) => {
        try {
            if (docs.length === 0) {
                res.send("User doesn't exists");
            } else {
                if (docs[0].password === hashPass) {
                    // user is verified
                    // make a token
                    // console.log(docs[0]);

                    const token = generateAccessToken({
                        userId: docs[0].userId,
                        email: docs[0].email,
                        name: docs[0].name,
                    });

                    // send privateKey to user
                    // const privateKey = decryptPrivateKey(
                    //     docs[0].privateKey,
                    //     docs[0].password
                    // );
                    // console.log(privateKey);

                    res.cookie('accessToken', token, {
                        expires: new Date(
                            Date.now() + 3600 * 1000 * 24 * 180 * 1
                        ), //second min hour days year
                        secure: true, // set to true if your using https or samesite is none
                        httpOnly: true, // backend only
                        sameSite: 'none', // set to none for cross-request
                    });

                    // res.cookie('privateKey', privateKey, {
                    //     // expires: new Date(
                    //     // Date.now() + 3600 * 1000 * 24 * 180 * 1
                    //     // ), econd min hour days year
                    //     // secure: true, // set to true if your using https or samesite is none
                    //     // httpOnly: false, // backend only
                    //     // sameSite: 'none', // set to none for cross-request
                    // });

                    // res.cookie('publicKey', docs[0].publicKey, {
                    //     // expires: new Date(
                    //     //     Date.now() + 3600 * 1000 * 24 * 180 * 1
                    //     // ), //second min hour days year
                    //     // secure: true, // set to true if your using https or samesite is none
                    //     // httpOnly: false, // backend only
                    //     // sameSite: 'none', // set to none for cross-request
                    // });

                    // res.set('jwt', token);
                    res.set('userId', docs[0].userId);
                    res.set('name', docs[0].name);
                    res.set('email', docs[0].email);
                    res.set('imageAddress', docs[0].imageAddress);
                    res.set('publicKey', docs[0].publicKey);
                    res.set('privateKey', docs[0].privateKey);

                    // res.set('publicKey', docs[0].publicKey);

                    // console.log(docs[0]);

                    res.send('User is verified');
                } else {
                    res.send('Invalid Password');
                }
            }
        } catch (err) {
            console.log(err);
        }
    });
});

//================================== Searching New User =========================================

// Search for the user, in the database
router.post('/search', authenticateToken, (req, res) => {
    var X = mangoose.model('User');
    var userId = req.body.userId;

    X.find({ userId: userId }, (err, docs) => {
        if (docs.length === 0) {
            res.send("Oops! User Doesn't Exist");
        } else {
            res.send('User Exists');
        }
    });
});

//================================== Adding two user ==========================================

// connect two people and create a new place in database to store chat
router.post('/connect', authenticateToken, async (req, res) => {
    var X = mangoose.model('User');
    var chatDatabase = mangoose.model('ChatDatabase');
    var senderId = req.body.senderId;
    var receiverId = req.body.receiverId;
    // console.log(senderId);
    // console.log(receiverId);
    var senderPublicKey = '';
    var receiverPublicKey = '';

    // Updating contacts array

    const docs = await X.findOneAndUpdate(
        { userId: senderId },
        {
            $addToSet: { contacts: receiverId },
        }
    );

    senderPublicKey = docs.publicKey;

    const data = await X.findOneAndUpdate(
        { userId: receiverId },
        { $addToSet: { contacts: senderId } }
    );

    receiverPublicKey = data.publicKey;

    // console.log('SENDER PUBLIC KEY ' + senderPublicKey);
    // console.log('RECEIVER PUBLIC KEY ' + receiverPublicKey);

    // Create a channel in database to store 2 user's chat
    const dbCode = databaseCode(senderId, receiverId);
    const newConnection = new chatDatabase({
        dbCode: dbCode,
        pk1: senderPublicKey,
        pk2: receiverPublicKey,
        chats: [],
    });
    newConnection.save().then(() => console.log('User Connected'));

    res.send('Connected');
});

// return the contacts a person's have
router.post('/quickchat/contacts', authenticateToken, (req, res) => {
    const userId = req.body.userId;
    UserModel = mangoose.model('User');
    UserModel.findOne({ userId: userId }, (err, docs) => {
        // res.send(docs);
        if (err) {
            console.log(err);
        }
        // console.log(docs);
        res.send(docs.contacts);
    });
});

// Take the Chat data from database and show the user
router.post('/getchatdata', authenticateToken, async (req, res) => {
    var chatDatabase = mangoose.model('ChatDatabase');

    const from = req.body.from;
    const to = req.body.to;
    const length = req.body.length;

    if (from === null || to == null) {
        res.send('no data');
        return;
    }
    const dbCode = databaseCode(from, to);

    const data = await chatDatabase.findOne(
        { dbCode: dbCode },
        { chats: { $slice: -length } }
    );
    if (data) {
        res.send(data);
        // console.log(data.chats);
    }
});

router.post('/getfirstmessage', async (req, res) => {
    var chatDatabase = mangoose.model('ChatDatabase');

    const from = req.body.from;
    const to = req.body.to;
    const length = -1;

    if (to.length === 0) {
        console.log('length is 0');
        res.send('Size of Contact is 0');
    } else {
        to?.forEach((val, index, arr) => {
            arr[index] = databaseCode(val, from);
            // console.log(val + ' ' + index + ' ', arr);
        });

        console.log(to);

        const data = await chatDatabase.find(
            { dbCode: { $in: to } },
            { chats: { $slice: -1 } }
        );
        if (data) {
            // console.log(data);
            res.send(data);
            // data.map((item) => {
            //     console.log(item.chats);
            // });
        }
    }
});

module.exports = router;
