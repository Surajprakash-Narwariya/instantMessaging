const crypto = require('crypto');
var path = require('path');
var fs = require('fs');

const random = Buffer.from('00 1 b1 c7 2c f5');

const pemToString = (str) => {
    var a = str.split('\n');
    a.splice(a.length - 2);
    a.splice(0, 1);
    var asdf = a.join('');
    return asdf;
};

const hash = (password) => {
    return crypto.createHash('sha256').update(password).digest('base64');
};

const hash128 = (data) => {
    return crypto.createHash('sha256').update(data).digest('base128');
};

const encryptionKey = (uniqueCode) => {
    return new Promise((resolve, reject) => {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 1024,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem',
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
                // cipher: 'aes-256-cbc',
                // passphrase: 'asdf',
            },
        });
        console.log(privateKey);
        resolve({
            privateKey: pemToString(privateKey),
            publicKey: pemToString(publicKey),
        });
    });
};

const encryptPrivateKey = (privateKey, hashPass) => {
    const algorithm = 'aes-256-cbc';

    // protected data
    const message = privateKey;

    // secret key generate 32 bytes of random data
    const Securitykey = hash128(hashPass);

    // the cipher function
    const cipher = crypto.createCipheriv(algorithm, Securitykey, random);

    let encryptedData = cipher.update(message, 'utf-8', 'hex');

    encryptedData += cipher.final('hex');
    // console.log(privateKey);
    return encryptedData;
    // console.log('Encrypted message: ' + encryptedData);
};

const decryptPrivateKey = (encryptedData, hashPass) => {
    const Securitykey = hash128(hashPass);

    const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Securitykey,
        random
    );

    let decryptedData = decipher.update(encryptedData, 'hex', 'utf-8');

    decryptedData += decipher.final('utf-8');
    return decryptedData;
    // console.log('Decrypted message: ' + decryptedData);
};

//==============================================TESTING

// This is the data we want to encrypt
// var { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
//     modulusLength: 1024,
//     publicKeyEncoding: {
//         type: 'spki',
//         format: 'pem',
//     },
//     privateKeyEncoding: {
//         type: 'pkcs8',
//         format: 'pem',
//         cipher: 'aes-256-cbc',
//         passphrase: 'asdf',
//     },
// });

const pubKey =
    'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCthFvT4TVVWxP+y+Elo6gLGSlt75+18MPvT7dJIIK1JptvQS9Gpyv6cYmO61uNmehGl+xsS8rJPtkeItHuzs85gFmrS9VMFt3GyfM2CuqXGiJKArI31xFINpGzsVB1KfyZty5Wu+nK5Zg1+O/5xJ4iX1W3+XIDTTKwWT0P9fOkkQIDAQAB';

const priKey =
    'MIIC3TBXBgkqhkiG9w0BBQ0wSjApBgkqhkiG9w0BBQwwHAQIyQdnZJLwuUkCAggAMAwGCCqGSIb3DQIJBQAwHQYJYIZIAWUDBAEqBBDLY8+aFzyz9D7tCokut2I4BIICgPkregVtUfUBg9/sGLpw/4NcSXDw8D29fYXAhMlIG+sdtg5sMajbQ6b7Rg0BDnNhax64o8M3IzCeU/3WH3dtDqsDi0Lqhr1Jp8vd0BWammSBxYBIKWT0xy9UXpQK+rV0uKUmAZTkkhrXyZ1bmJtae+9/LChP9WuALNYKkzY4nTWOBX0WSxPWj7ZhkZAqZvMEtdvQPgOSjmGzateNsN1UreFEdUpnw+HElxJrvLRY8W/aV6QzG+Wr4UJHREFQgU4hqQFNfaN/kfw4kEtf+1kkev356TWAEgzDBMSagnxAmBWR67vkQE0liVuD/X/aqvWYYHStrR8EyfGrgBJ38xnJWV0i7pcQ5BQUMU9D8uFHhlN23JmrsZDq/F5JmtIaZZZR4gdnrRZ8JoIQD6uUTTZu3anj91+tl5xR9hZUIBE1BLJX+dkckdiWGtTaPnnIv/tOLMZzlBdVGbE7UBh/Cjj16uGVNADiJ/AGOfjLVIf6MSCprRmoh6ZC3X7xcNCDIyFkfdGtTbwIYvPFE5uRx0s+Mc0CPJTvMWUxQP9Xr+lmbC9A6lbfwdqELa/wL4JgFX/cDR16Ibeo+EC7izG04kooC1qsstfOPB4uapLXXb8/Eo6etz3yh/G71hSIHouoUfkzlxZuZC8Ug2mip6MnaaKBeXbpVL+aatfz7LBlco7HTMxAWAgt7Q4fHtZxe4wRVW4q03r4MBp0dAXAUCf3uPOpQEV+uQqllUSWJKQaZfH5YdENCjPvQ/j1VMldLVPVGgP7ppN0l8XxpgNmmEdtrlxTj6QLjV0vnxrGx2zEYtuntU3bQF5AazEy3HYAYEtiTkd+2ZSWd/9h0u/GW5bAvg1+wjw=';

const cipher =
    'mQtcfuGBxSAZzARkjj2+ukl2DG29Xcm6r0V0di123dCU/OS/VUqcWrcKe0mU8xQd7BtE9Wtbi1/zd4R9ZyiGnFiqmJkZTGxXo7xQ265ED22l5suxfyC/axvAMMZObdsQ5dPXevyD7paE/BlATWnCFAI8bZrjP1Ne2VYQQdl5oSg=';

// console.log(decryptMessage(priKey, 'Suraj99', cipher));

function encryptMessage(publicKey, message) {
    const enc = crypto.publicEncrypt(
        {
            key:
                '-----BEGIN PUBLIC KEY-----\n' +
                publicKey +
                '\n-----END PUBLIC KEY-----',
            // padding: cryptoBrowserify.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256',
        },
        // We convert the data string to a buffer using `Buffer.from`
        Buffer.from(message)
    );
    console.log(Buffer.from(message));
    return enc.toString('base64');
}

function decryptMessage(privatekey, passphrase, cipherCode) {
    const decryptData = crypto.privateDecrypt(
        {
            key:
                '-----BEGIN ENCRYPTED PRIVATE KEY-----\n' +
                privatekey +
                '\n-----END ENCRYPTED PRIVATE KEY-----',
            oaepHash: 'sha256',
            passphrase: passphrase,
        },
        Buffer.from(cipherCode, 'base64')
    );
    return decryptData.toString('utf-8');
}

// console.log(encryptMessage(pubKey, 'fuckYou'));

module.exports = { hash, encryptionKey, encryptPrivateKey, decryptPrivateKey };
