const {config} = require('./config');
const {verifyTOTP} = require('./totp')

if (config.server.CREATE_SERVER) {
    const server = require('./server/index');

    server.createServer(config.server.SERVER_HOST, config.server.SERVER_PORT);

    function setEncodingScheme(encodingScheme) {
        server.setEncodingScheme(encodingScheme);
    }
}

/**
 * Validates a token, given the secret of the user.
 *
 * @param {integer} token           - The 6-digit token code obtained from the authenticator app.
 * @param {string} secret           - The user's secret
 * @param {integer} [window= 1]     - The window which should be checked for verifying tokens. If it is set to '1', the validateToken function will check TOTPs created one after and one before the entered token.
 * @return {boolean}                - Returns true if the token is valid, false otherwise.
 *
 */

function validateToken(token, secret, window = 1) {
    return verifyTOTP(token, secret, window);
}

module.exports = validateToken;
