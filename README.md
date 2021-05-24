# Node.js TOTP Verification and User Management Package
**Version 1.0.0**

## Summary

---
This package has the capability of setting up an authentication server that works with Google Authenticator or any other
similar app that generates TOTP tokens based on [RFC 6238](https://datatracker.ietf.org/doc/html/rfc6238) and 
[RFC 4226](https://datatracker.ietf.org/doc/html/rfc4226). Full capabilities;
  * Verify generated tokens,
  * Generate a simple authentication server,
  * Generate unique secrets for different users,
  * Connect to a MySQL or Redis datastore instance to manage users and secrets,
  * Provide a very simple front-end as a POC

There is also a `Dockerfile` and a `docker-compose.yaml` file for the Dockerization of the application.

---

## Dependencies
  * `dotenv: 9.0.2`
  * `express-handlebars: 5.3.2`
  * `hi-base32: 0.5.1`
  * `method-override: 3.0.0`
  * `qrcode-terminal: 0.12.0`
  * `mysql2: 2.2.5`
  * `redis: 3.1.2`
    
## Setup

---
To start the setup, after downloading the package, take a look at the `.env-example` file that is in the installation.
This file contains numerous variables for you to be able to manage and customize the installation to your needs. Create a copy
of the file called `.env` and start editing variables there.\
Variables;

* `SECRET_LENGTH`: Determines the length of the secrets that will be generated for new users.\
  **Default value:** `20` \
  **Note:** This length can be 20 characters max if you are using this package to connect to a Redis or MySQL database.
  

* `CREATE_SERVER`: Determines whether an authentication server will be generated.\
  **Possible values:**
    * `true` **(default)**
    * `false`
    

* `SERVER_HOST`: The hostname of the auth server.\
  **Default Value:** `localhost`
  

* `SERVER_PORT`: The port of the auth server.\
  **Default value:** `60000`
  

* `SERVER_AUTH_PATH`: The path for the authentication requests. The server will listen to: 
  `<SERVER_HOST>/<SERVER_AUTH_PATH>`, so, `localhost/auth` by default. \
  **Default value:** `auth`
  

* `SERVER_ENCODING_SCHEME`: If you set this variable to base64, your messages will be decoded at the server side. \
  **Possible values:**
    * `ascii` **(default)**
    * `base64` 
    

* `CREATE_DATABASE`: Set to `false` if you do not want to create a new database. Otherwise, the module creates a new database called `auth_users`. \
  **Possible values:**
    * `true` **(default)**
    * `false` 
    

* `STORAGE_TYPE`: Set the backend database type. \
  **Possible values:**
    * `mysql` **(default)**
    * `redis`
    

* `DATABASE_HOST`: Set the database host. \
  **Default value:** `localhost`
  

* `DATABASE_PORT`: Set the database port.\
  **Default values:** 
  * `6379` for Redis
  * `3306` for MySQL  
    

* `DATABASE_USES_TLS`: Uncomment if your database uses TLS.
    * `KEY_FILE_PATH`: The path to the key file.
    * `CERT_FILE_PATH`: The path to the cert file.
    * `CA_FILE_PATH`: The path to the CA file.


* `DATABASE_USERNAME`: Set database username.\
    **Default value:** `root`


* `DATABASE_PASSWORD`: Set database username.\
  **Default value:** `root`
  

* `DATABASE_NAME`: Set the database to use when using MySQL. Equivalent to: `USE <DATABASE_NAME>`.\
  **Default value:** `auth_users`