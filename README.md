# Nodejs API Boilerplate

## Requirements

- Facebook Developer Account
- Google Cloud Project
- AWS SES

## Content

This boilerplate contains:

- Simple Email + Password Authentication
- Email Verification w/ resend
- Reset Password
- Email Templates (Pug)
- Integration with AWS SES
- Json Web Tokens
- Mongo database with Mongoose
- Encrypted passwords with salt

## Configuration

Configuration is obtained through a `config.json` file. To run this project, you should create yours based on `config.json.example`.

- **PORT** - The port the server will run at
- **APP_NAME** - The name of your application
- **LOG_PATH** - The full path of your log file
- **BASE_URL** - The base url of your server (used for OAuth callbacks)
- **REDIRECT_URL** - The url of your frontend (used on the emails)
- **MONGODB.USERNAME** - Username to connect to your mongo db
- **MONGODB.PASSWORD** - Password to connect to your mongo db
- **MONGODB.HOST** - Host used to connect to your mongo db (check `server.js`)
- **CRYPTO.HASH_BYTES** - Size of password hashes
- **CRYPTO.SALT_BYTES** - Size of password salts
- **CRYPTO.ITERATIONS** - Number of iterations for generating passwords (higher = better + slower)
- **JWT.KEY** - Key for generating and decrypting JWT tokens
- **JWT.TOKEN_CALLBACK_URL** - Frontend URL to set the token on the client
- **FACEBOOK.CLIENT_ID** - Client ID of your facebook app
- **FACEBOOK.CLIENT_SECRET** - Client secret of your facebook app
- **GOOGLE.CLIENT_ID** - Client ID of your google app
- **GOOGLE.CLIENT_SECRET** - Client secret of your google app
- **AWS.ACCESS_KEY_ID** - Access key ID of your AWS IAM account
- **AWS.SECRET_ACCESS_KEY** - Access secret access key of your AWS IAM account
- **AWS.REGION** - AWS region to use
- **AWS.SOURCE_EMAIL** - Source email to use on SES

## How to run

1. Clone the repo
2. Create the configuration file
3. Run `npm install`
4. Run `npm run start:dev` for dev environment, or `npm run start` for production.

## Details

### Models

The mongoose models are defined under the `models` folder.
The only existing model at the moment is the `User`.

### Logger

The `logger` directory exports a winston logger object, which is creating a `out.log` file under the `logs` folder once the server starts running and also logging to console, with timestamp, log level and content.

### Emails

The `emails` folder contains integration with AWS SES, using nodemailer. Each email is defined in a separate file, for easier importing, and is fetching the email templates, in pug format, from the `templates` directory.

### Authentication

All passport-based authentication is defined under the `auth` directory.

- `facebook.js` contains Facebook OAuth2.0 based authentication.
- `google.js` contains Google OAuth2.0 based authentication.
- `local.js` contains Email+Password based authentication.
- `jwt.js` exports a middleware for validating the JWT tokens

### Routes

Routes are defined under the `routes` directory. Currently, only user-based routes are defined.
