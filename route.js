const d = require('./app');
const express = require('express');
const router = express.Router();
const mangoose = require('mongoose');

require('./app.js');

router.post('/delete/message/:id', (req, res) => {
    // console.log(req.body.data);
    const { data } = req.body;
    // res.send(req.params.id);

    // console.log(data);
    const dbCode = d.databaseCode(data.fromUserId, data.toUserId);

    var chatDatabase = mangoose.model('ChatDatabase');

    chatDatabase.findOneAndUpdate(
        { dbCode: dbCode },
        {
            $pull: { chats: { _id: data._id } },
        },
        (err, docs) => {
            if (err) {
                console.log(err);
            } else {
                console.log('Delete Message', data.message);
                res.send('Message Deleted Successfully!');
            }
        }
    );
});

module.exports = router;
