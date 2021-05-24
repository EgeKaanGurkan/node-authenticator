const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const exprhb = require('express-handlebars')
const methodOverride = require('method-override')
// const redis = require('redis')
const { verifyTOTP } = require("../totp")
const { config } = require("../config")
const { generateSecret } = require("../generateSecret")
const database = require('../database/index')
const querystring = require('querystring');


const encoding = {
    base64: "base64",
    ascii: "ascii"
}

global.encodingScheme = config.server.SERVER_ENCODING_SCHEME

// Express setup
const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
app.use(cors())
app.use(methodOverride("_method"))

app.engine('handlebars', exprhb({
    defaultLayout: "main",
    helpers: {
        ifCond: function(v1, v2, options) {
            if(v1 === v2) {
                return options.fn(this);
            }
            return options.inverse(this);
        }
    }
}));
app.set('view engine', 'handlebars')
// End Express setup

    /*let redisClient = redis.createClient()
redisClient.on('connect',function () {
    console.log("Redis client connected...")
});*/

database.initDatabase();

/**
 * Creates an authentication server based on the host and port given.
 *
 * @param {string} host     - The hostname or IP of the server.
 * @param {integer} port    - The port that the server will listen to.
 */

function createServer(host, port) {
    app.listen(port, (host) => {
        console.log(`Authentication server is running on ${config.server.SERVER_HOST}:${port}`)
    })
}

/**
 * Sets the encoding scheme for the server.
 *
 * @param {('ascii' | 'base64')} encodingScheme - The encoding scheme that will be set.
 */

function setEncodingScheme(encodingScheme = encoding.ascii) {
    global.encodingScheme = encodingScheme
}

/**
 * Returns the encoding scheme used by the server
 * @return {string}
 */

function getEncodingScheme() {
    return global.encodingScheme
}


/**
 * Provides an error printer
 * @param e {Error} - The error thrown
 */

function printError(e) {
    console.log("ERROR: " + e.name + " | " + e.message);
    console.log("\tIn file: " + e.filename);
    console.log("\tLine: " + e.line + " column: " + e.column);

    if (e instanceof TypeError) {
        console.log("\tPossible solutions: ")
        console.log("\t\tCheck if you are using the right encoding scheme from the SERVER_ENCODING_SCHEME variable in the .env file.");
    }
}

app.get('/', (req, res) => {
    //res.render('signIn');
    //res.send("OK")
    res.redirect('/signIn');
});

app.get('/health', (req, res, next) => {
    res.status(200).send({
        status: "OK"
    })
});

app.post('/' + config.server.SERVER_AUTH_PATH, (req, res) => {
    console.log("Request Received")
    let username, password;

    if (global.encodingScheme === encoding.ascii) {
        username = req.body.username
        password = req.body.password
    } else if (global.encodingScheme === encoding.base64) {
        console.log(encoding.base64)
        username = Buffer.from(req.body.username, 'base64').toString('ascii')
        password = Buffer.from(req.body.password, 'base64').toString('ascii')
    }

    let authCode = password.split(":")[0]
    password = password.split(":")[1]

    try {
        if (password.length < 6) {
            res.status(400).json({
                status: "ERROR",
                message: "The password cannot be shorter than 6 characters."
            }).send()
            console.log("Password length is too short. Received password: " + password)
            return;
        }
    } catch (e) {
        printError(e);
    }

    try {
        if (authCode.length < 6) {
            res.status(400).json({
                status: "ERROR",
                message: "The auth code cannot be shorter than 6 characters."
            }).send()
            console.log("Auth code length is too short.")
            return;
        }
    } catch (e) {
        printError(e);
    }
    console.log("Username: " + username)
    console.log("Password: " + password)
    console.log("Auth Code: " + authCode)

    let authTrue = verifyTOTP(authCode, config.app.SECRET)
    res.json({
        status: "OK",
        authenticated: authTrue
    }).send()
});

app.get('/register', function(reqs,res){
    res.render('register')
});

app.post('/register', function (req, res, next) {
    let username = req.body.username;
    let name = req.body.name;
    let surname = req.body.surname;
    let password = req.body.password;

    console.log("Name: " + name);
    console.log("Surname: " + surname);
    console.log("Password: " + password);

    let secret = database.registerUser(username, name, surname, password);
    if (secret) {

        const query = querystring.stringify({
            "status": "OK",
            "heading": "User Registered!",
            "message": "The user " + username + " has been added.",
            "secret": secret,
            "uses2FA": false
        });
        res.redirect('/signin?' + query);
    } else {
        res.statusCode = 400;
        res.render("register", {
            status: "ERROR",
            message: "The user " + username + " could not be added."
        })
    }

});

app.get('/signin', function (req, res, next) {
    res.render("signIn", {
        query: req.query
    })
})

app.post('/signin', function (req,res, next) {
    let username = req.body.username;
    let password = req.body.password;
    let authCode = req.body.authCode;

    database.signUserIn(username, password, function (err, user) {
        if (!user) {
            if (err.code === 0) {
                let query = querystring.stringify({
                    "status": "ERROR",
                    "heading": "User does not exist",
                    "username": username,
                    "message": "Please register first."
                });
                res.redirect('/signin?' + query);
            } else if (err.code === 1) {
                let query = querystring.stringify({
                    "status": "ERROR",
                    "heading": "Wrong Password",
                    "username": username,
                    "message": "Please try again."
                });
                res.redirect('/signin?' + query);
            } else if (err.code === 3) {
                let query = querystring.stringify({
                    "status": "ERROR",
                    "heading": "Unresolved database type: " + config.database.TYPE,
                    "username": username,
                    "message": err.message
                });
                res.redirect('/signin?' + query);
            }
        } else if (user && err.code === 2 && authCode) {
            if (verifyTOTP(authCode, user.secret)) {
                let query = querystring.stringify({
                    "name": user.name,
                    "surname": user.surname,
                    "username": user.username,
                    "uses2FA": user.uses2FA,
                    "secret": user.secret
                });
                res.redirect('/user?' + query);
            } else {
                let query = querystring.stringify({
                    "status": "ERROR",
                    "heading": "Wrong authentication code",
                    "username": username,
                    "message": "Please try again.",
                    "uses2FA": true
                });
                res.redirect('/signin?' + query);
            }
        } else if (user && err.code === 2 && !authCode) {
            console.log(user.secret)
            let query = querystring.stringify({
                "status": "2FA NEEDED",
                "heading": "2FA Needed!",
                "username": username,
                "message": "Please enter the code in your Google Authenticator app.",
                "uses2FA": true
            });
            res.redirect("/signin?" + query);
        } else {
            let query = querystring.stringify({
                "name": user.name,
                "surname": user.surname,
                "username": user.username,
                "uses2FA": user.uses2FA,
                "secret": user.secret
            });
            res.redirect('/user?' + query);
        }
    })
})

app.get('/user', function (req, res,next) {
    res.render("detail", {
        user: req.query
    })
});

app.post("/change2FA", function (req, res, next){
    database.change2FA(req.query.username, function (user){
        let query = querystring.stringify({
            "name": user.name,
            "surname": user.surname,
            "username": user.username,
            "uses2FA": user.uses2FA,
            "secret": user.secret
        });
        res.redirect('/user?' + query);
    })

});

module.exports = {
    createServer,
    setEncodingScheme
}




