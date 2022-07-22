const express = require('express');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const router = express.Router();
require('dotenv').config();
const password = process.env.DB_PASSWORD;
const myFirstDatabase = process.env.MY_FIRST_DATABASE;
const url = `mongodb+srv://suraj:${password}@encryptedmessaging.r3mld.mongodb.net/${myFirstDatabase}?retryWrites=true&w=majority`;

// description :
//     Routes => (i) "/upload" => for uploading file;
//               (ii) "/image/:id" => for getting image from database
//               (iii) '/files' => for development only, for getting all information from database
//     All the images will be stored in collection name "photos.chunks" and "photos.file"

const storage = new GridFsStorage({
    url: url,
    file: (req, file) => {
        if (
            file.mimetype === 'image/jpeg' ||
            file.mimetype === 'image/png' ||
            file.mimetype === 'image/jpg'
        ) {
            return {
                bucketName: 'photos',
            };
        } else {
            return null;
        }
    },
});
const upload = multer({ storage });

const connect = mongoose.createConnection(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Used to retreive data from the database
// var gfs, gridfsBucket;

// connect.once('open', () => {
//     gfs = Grid(connect.db, mongoose.mongo);
//     gfs.collection('photos');
// });
let gfs, gridfsBucket;
connect.once('open', () => {
    gridfsBucket = new mongoose.mongo.GridFSBucket(connect.db, {
        bucketName: 'photos',
    });

    gfs = Grid(connect.db, mongoose.mongo);
    gfs.collection('photos');
});

// routes to configure upload and download

router.post('/upload', upload.single('file'), (req, res) => {
    // console.log('uploaded');
    console.log(req.file.filename);
    res.json({ file: req.file.filename });
    // res.send('upload');
});

// route for image details
router.get('/files', async (req, res) => {
    await gfs.files.find().toArray((err, files) => {
        if (!files || files.length === 0) {
            return res.send('no files found');
        }
        return res.json(files);
    });
});

// route to get image in browser
router.get('/image/:filename', async (req, res) => {
    console.log(req.params.filename);

    try {
        const file = await gfs.files.findOne({ filename: req.params.filename });
        // console.log(file);
        if (!file || file.length === 0) {
            return res.send('No files found');
        }
        if (
            file.contentType === 'image/jpeg' ||
            file.contentType === 'image/png' ||
            file.contentType === 'image/jpg'
        ) {
            const readStream = gridfsBucket.openDownloadStreamByName(
                file.filename
            );
            readStream.pipe(res);
        }
    } catch (err) {
        res.send('there is some error');
    }
});

router.post('/updateImage', (req, res) => {
    const imageAddress = req.body.imageAddress.file;
    // console.log(imageAddress);
    const userId = req.body.userId;
    // console.log(userEmail);

    var User = mongoose.model('User');
    User.findOneAndUpdate(
        { userId: userId },
        { imageAddress: imageAddress },
        { new: true },
        (err, docs) => {
            if (err) {
                console.log(err);
            } else {
                // console.log(docs);
                console.log('ImageField is updated');
                res.send(docs);
            }
        }
    );
});

router.post('/getprofilePicture', async (req, res) => {
    var from = req.body.contacts;
    var user = mongoose.model('User');
    // console.log('abcd' + from);

    const query = await user.find({ userId: { $in: from } });
    // console.log(query);
    res.send(query);
    // res.send('hello');
});

module.exports = router;
