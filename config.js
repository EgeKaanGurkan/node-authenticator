require('dotenv').config();

const env = process.env

const CREATE_SERVER = function () {
    return !(env.CREATE_SERVER && env.CREATE_SERVER === "false");
}

const CREATE_DATABASE = function () {
    return !(env.CREATE_DATABASE && env.CREATE_DATABASE === "false");
}

const config = {
    app: {
        /* The secret to be added to the authenticator app. */
        SECRET: env.AUTH_SECRET,
        SECRET_LENGTH: parseInt(env.SECRET_LENGTH) || 20,
        TOKEN_WINDOW_SIZE: parseInt(env.TOKEN_WINDOW_SIZE) || 0
    },
    server: {
        CREATE_SERVER: CREATE_SERVER() || false,
        SERVER_HOST: env.SERVER_HOST || 'localhost',
        SERVER_PORT: parseInt(env.SERVER_PORT) || 60000,
        /* The path for the API calls */
        SERVER_AUTH_PATH: env.SERVER_AUTH_PATH || 'auth',
        SERVER_ENCODING_SCHEME: env.SERVER_ENCODING_SCHEME || "ascii"
    },
    database: {
        CREATE_DATABASE: CREATE_DATABASE() || false,
        TYPE: env.STORAGE_TYPE || "mysql",
        DATABASE_PORT: env.DATABASE_PORT || ((env.STORAGE_TYPE == "redis") ? 6379 : 3306),
        DATABASE_HOST: env.DATABASE_HOST || 'localhost',
        DATABASE_USERNAME: env.DATABASE_USERNAME || 'root',
        DATABASE_PASSWORD: env.DATABASE_PASSWORD,
        DATABASE_NAME: env.DATABASE_NAME || "auth_users",
        DATABASE_USES_TLS: env.DATABASE_USES_TLS || false,
        KEY_FILE_PATH: env.KEY_FILE_PATH,
        CERT_FILE_PATH: env.CERT_FILE_PATH,
        CA_FILE_PATH: env.CA_FILE_PATH
    }
}

module.exports = {
    config
};