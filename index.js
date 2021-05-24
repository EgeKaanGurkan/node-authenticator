const {config} = require('./config');

if (config.server.CREATE_SERVER) {
    const server = require('./server/index');

    server.createServer(config.server.SERVER_HOST, config.server.SERVER_PORT);

    function setEncodingScheme(encodingScheme) {
        server.setEncodingScheme(encodingScheme);
    }
}
