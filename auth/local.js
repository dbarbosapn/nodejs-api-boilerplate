const passport = require("passport");
const LocalStrategy = require("passport-local");
const crypto = require("crypto");
const models = require("../models");
const config = require("../config.json");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const log = require("../logger");
const emailVerification = require("../emails/email-verification");

passport.use(
	new LocalStrategy(
		{
			usernameField: "email",
			passwordField: "password",
		},
		function verify(email, password, cb) {
			models.User.findOne({ email: email }, function (err, user) {
				if (err) {
					log.error("Error searching user by email", err);
					return cb(null, false, { message: "Internal Server Error" });
				}

				if (!user) {
					return cb(null, false, { message: "Incorrect username or password" });
				}

				crypto.pbkdf2(
					password,
					user.salt,
					config.CRYPTO.ITERATIONS,
					config.CRYPTO.HASH_BYTES,
					"sha512",
					function (err, hash) {
						if (err) {
							log.error("Error hashing password", err);
							return cb(null, false, { message: "Internal Server Error" });
						}

						if (!crypto.timingSafeEqual(Buffer.from(user.hash, "hex"), hash)) {
							return cb(null, false, {
								message: "Incorrect username or password",
							});
						}

						if (!user.verified) {
							return cb(null, false, {
								message: "Email not verified",
							});
						}

						return cb(null, user);
					}
				);
			});
		}
	)
);

function init(router) {
	router.post(
		"/login",
		passport.authenticate("local", { session: false }),
		function (req, res) {
			const body = { _id: req.user._id.toString() };
			const token = jwt.sign({ user: body }, config.JWT.KEY);

			return res.json({ token });
		}
	);

	router.post(
		"/register",
		body("email").isEmail().toLowerCase(),
		body("password").isLength({ min: 5 }),
		body("name").trim().notEmpty().isAlpha(undefined, { ignore: " " }),
		function (req, res) {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}

			let salt = crypto.randomBytes(config.CRYPTO.SALT_BYTES).toString("hex");

			let verificationCode = crypto
				.randomBytes(config.CRYPTO.SALT_BYTES)
				.toString("hex");

			crypto.pbkdf2(
				req.body.password,
				salt,
				config.CRYPTO.ITERATIONS,
				config.CRYPTO.HASH_BYTES,
				"sha512",
				function (err, hash) {
					if (err) {
						log.error("Error hashing password", err);
						return res.status(500).json(err);
					}

					models.User.create(
						{
							email: req.body.email,
							name: req.body.name,
							salt: salt,
							hash: hash.toString("hex"),
							verified: false,
							verification_code: verificationCode,
							last_verification_sent: new Date(),
						},
						function (err) {
							if (err) {
								if (err.code == 11000) {
									return res
										.status(409)
										.json({ message: "Email is already in use" });
								}

								log.error("Error creating user", err);
								return res.sendStatus(500);
							}

							emailVerification
								.send(req.body.email, req.body.name, verificationCode)
								.then(() => res.sendStatus(200))
								.catch((err) => {
									log.error("Error sending email", err);
									return res.sendStatus(500);
								});
						}
					);
				}
			);
		}
	);
}

module.exports = { init };
