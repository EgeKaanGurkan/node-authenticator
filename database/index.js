const fs = require("fs");
const {config} = require("../config")
const {generateSecret} = require('../generateSecret')
const {verifyTOTP} = require("../totp")

const databaseType = config.database.TYPE;
let database;

function initDatabase() {
    if (databaseType === "redis") {
        const redis = require('redis');

        let clientJSON = {
            port: config.database.DATABASE_PORT,
            host: config.database.DATABASE_HOST,
            password: config.database.DATABASE_PASSWORD,
        }
        if (config.database.DATABASE_USES_TLS && config.database.CA_FILE_PATH && config.database.KEY_FILE_PATH && config.database.CERT_FILE_PATH) {
            clientJSON.tls = {
                key: fs.readFileSync(config.database.KEY_FILE_PATH),
                cert: fs.readFileSync(config.database.CERT_FILE_PATH),
                ca: fs.readFileSync(config.database.CA_FILE_PATH)
            }
        }
        database = redis.createClient(clientJSON);

        database.on('connect', function () {
            console.log("Redis client connected...")
        });

    } else if (databaseType === "mysql") {
        //console.log("database/index.js -> initDatabase()\n\tmysql has not been implemented yet.\n")
        const mysql = require('mysql2');

        let clientJSON = {
            host: config.database.DATABASE_HOST,
            port: config.database.DATABASE_PORT,
            user: config.database.DATABASE_USERNAME,
            password: config.database.DATABASE_PASSWORD,
            database: config.database.DATABASE_NAME,
            multipleStatements: true
        }

        if (config.database.DATABASE_USES_TLS && config.database.CA_FILE_PATH) {
            clientJSON.ssl = {
                ca: fs.readFileSync(config.database.CA_FILE_PATH)
            }
        }

        database = mysql.createConnection(clientJSON);

        database.connect(function (err) {
            if (err) {
                console.log("Error connecting to MySQL database: ")
                console.log(err);
            }
            console.log("MySQL client connected with id " + database.threadId + "...");
            if (config.database.CREATE_DATABASE) {
                createMySQLDatabase();
            } else {
                console.log("Connecting to existing database: " + config.database.DATABASE_NAME + "...")
            }
            createMySQLTable();
        });

    } else {
        console.log("Database type " + databaseType + " is not supported.\nSupported datastores: mysql, redis.")
    }
}

function registerUser(username, name, surname, password) {
    if (databaseType === "redis") {
        let userSecret = generateSecret(config.app.SECRET_LENGTH);
        console.log("Secret for " + name + ": " + userSecret)
        database.hmset(username, [
            'name', name,
            'surname', surname,
            'password', password,
            'username', username,
            'secret', userSecret,
            'uses2FA', false
        ]);
        return userSecret;
    } else if (databaseType === "mysql") {
        let userSecret = generateSecret(config.app.SECRET_LENGTH);
        console.log("Secret for " + name + ": " + userSecret);
        let query = 'INSERT INTO users (username, name, surname, password, secret, uses2FA) values ("' + username + '","' + name + '","' + surname + '","' + password + '","' + userSecret + '",' + 'false' + ')'
        database.query(query, function (err) {
            if (err) throw err;
            return false;
        })
        return true;
    } else {
        console.log("ERROR: Could not add user " + username + ".\n\tSpecified database type could not be resolved.");
        return false;
    }
}

function signUserIn(username, password, callback) {
    if (databaseType === "redis") {
        database.hgetall(username, function (err, user) {
            if (!user) {
                let error = {
                    code: 0,
                    message: "User does not exist"
                }
                callback(error, null);
            } else {
                if (user.password !== password) {
                    let error = {
                        code: 1,
                        message: "WRONG PASSWORD"
                    }
                    callback(error, null);
                } else if (user.password === password && user.uses2FA === "true") {
                    let error = {
                        code: 2,
                        message: "2FA NEEDED"
                    }
                    callback(error, user);
                } else if (user.password === password && user.uses2FA === "false") {
                    callback({message: "OK"}, user);
                }
            }
        })
    } else if (databaseType === "mysql") {
        let query = "SELECT * FROM users WHERE username='" + username + "'";
        database.query(query, function (err, result, fields){
            if (err) throw err;
            if (!result[0]) {
                let error = {
                    code: 0,
                    message: "User does not exist"
                }
                callback(error, null);
            } else {
                let user = result[0]

                user = mySQLChangeBoolTypes(user);

                if (user.password !== password) {
                    let error = {
                        code: 1,
                        message: "WRONG PASSWORD"
                    }
                    callback(error, null);
                } else if (user.password === password && user.uses2FA === true) {
                    let error = {
                        code: 2,
                        message: "2FA NEEDED"
                    }
                    callback(error, user);
                } else if (user.password === password && user.uses2FA === false) {
                    callback({message: "OK"}, user);
                }
            }

        });

    } else {
        let error = {
            code: 3,
            message: "The specified database type could not be resolved."
        }
        callback(error, null)
        return false;
    }
}

function change2FA(username, callback) {
    if (databaseType === "redis") {
        database.hget(username, 'uses2FA', function (err, res) {
            if (res === "true") {
                database.hmset(username, 'uses2FA', "false");
            } else if (res === "false") {
                database.hmset(username, 'uses2FA', "true");
            }
            database.hgetall(username, function (err, user) {
                callback(user);
            })
        });
    } else if (databaseType === "mysql") {
        let query = "SET SQL_SAFE_UPDATES = 0; UPDATE users SET uses2FA = NOT uses2FA WHERE username='" + username + "'";

        database.query(query, function (err, result, fields) {
            if (err) throw err;
            let query = "SELECT * FROM users WHERE username='" + username + "'"
            database.query(query, function (err, result, fields) {

                callback(mySQLChangeBoolTypes(result[0]))
            });
        })
    }
}

function mySQLChangeBoolTypes(user) {
    user.uses2FA = user.uses2FA === 1;
    return user;
}

function createMySQLDatabase() {
    database.query("CREATE DATABASE " + config.database.DATABASE_NAME, function (error, results, fields) {
        if (error && error.errno == 1007) {
            console.log("Can't create database '" + config.database.DATABASE_NAME + "'; database exists.");
        }
        database.query("USE " + config.database.DATABASE_NAME);
    });
}

function createMySQLTable() {
    let query = "CREATE TABLE users (id INT unsigned NOT NULL AUTO_INCREMENT, username varchar(20), name varchar(20), surname varchar(20), password varchar(20), secret varchar(50), uses2FA boolean, primary key (id));"
    database.query(query, function (error) {
        if (error) {
            if (error.errno == 1050) {
                console.log("Can't create table 'users'; table exists")
            } else {
                throw error;
            }
        } else {
            console.log("Created table 'users'.")
        }
    })
}

module.exports = {
    initDatabase,
    registerUser,
    signUserIn,
    change2FA
}