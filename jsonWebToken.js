const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// const secretKey = crypto.randomBytes(64).toString('hex');
// console.log(secretKey);

const secretKey = process.env.SECRET_KEY;

function generateAccessToken({ userId: userId, email: email, name: name }) {
    // console.log(userId);
    return jwt.sign({ userId: userId, email: email, name: name }, secretKey, {
        expiresIn: '86400s',
    });
}

function authenticateToken(req, res, next) {
    const token = req.cookies.accessToken;
    // console.log('TOKEN IS : ' + token);

    if (token == null) return res.send('invalid access, please login');
    jwt.verify(token, secretKey, (err, user) => {
        console.log(err);
        if (err) return res.sendStatus(403);

        next();
    });
}

module.exports = { generateAccessToken, authenticateToken };
