const crypto = require('crypto');

const hash = (password) => {
    return crypto.createHash('sha256').update(password).digest('base64');
};

module.exports = { hash };
