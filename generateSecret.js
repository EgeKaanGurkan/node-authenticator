const crypto = require('crypto');
const base32 = require('hi-base32');
const qrcode = require('qrcode-terminal');

/*
 * Use this function to generate a secret that will
 * be shared with a client app, like Google Authenticator.
 * Then replace the SECRET constant in `./config.js` with
 * the generated secret for this prompt example to run correctly.
 */
function generateSecret(length = 5) {
    const randomBuffer = crypto.randomBytes(length);
    const secret = base32.encode(randomBuffer).replace(/=/g, '');
    return secret;
}

function generateAndPrintSecret(length = 5) {
    const randomBuffer = crypto.randomBytes(length);
    const secret = base32.encode(randomBuffer).replace(/=/g, '');
    console.log();
    qrcode.generate(`otpauth://totp/example?secret=${secret}`);
    console.log(`\nSecret: ${secret}`);
    console.log('Use this secret to add a new account in Google Authenticator app. Also, update the value of AUTH_SECRET in the .env file with this new secret.');
}

module.exports = {
    generateSecret,
    generateAndPrintSecret
}