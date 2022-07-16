const express = require("express");
const { body, query, param, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const log = require("../logger");
const models = require("../models");
const emailVerification = require("../emails/email-verification");
const forgotPasswordEmail = require("../emails/forgot-password");
const config = require("../config.json");
const crypto = require("crypto");

const router = new express.Router();

/**
 * Get user by id
 */
router.get("/id", query("id").isLength(24), async function (req, res) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		let user = await models.User.findOne({
			_id: mongoose.Types.ObjectId(req.query.id),
		})
			.hideSensitive()
			.exec();

		if (user == null) {
			return res.status(404).json({ message: "User not found" });
		}

		return res.status(200).send(user);
	} catch (err) {
		log.error("Error verifying email", err);
		return res.sendStatus(500);
	}
});

/**
 * Get user by email
 */
router.get(
	"/email",
	query("email").isEmail().toLowerCase(),
	async function (req, res) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			let user = await models.User.findOne({
				email: req.query.email,
			})
				.hideSensitive()
				.exec();

			if (user == null) {
				return res.status(404).json({ message: "User not found" });
			}

			return res.status(200).send(user);
		} catch (err) {
			log.error("Error verifying email", err);
			return res.sendStatus(500);
		}
	}
);

/**
 * Resend Verification Email
 */
router.post(
	"/resend-verification",
	body("email").isEmail().toLowerCase(),
	async function (req, res) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			let user = await models.User.findOne({
				email: req.body.email,
			});

			if (user == null) {
				return res.status(404).json({ message: "User not found" });
			}

			if (user.verified) {
				return res.status(304).json({ message: "User already verified" });
			}

			if (new Date() - user.last_verification_sent < 2 * 60 * 1000) {
				return res
					.status(429)
					.json({ message: "Verification email sent already" });
			}

			let verificationCode = crypto
				.randomBytes(config.CRYPTO.SALT_BYTES)
				.toString("hex");

			user.verification_code = verificationCode;
			user.last_verification_sent = new Date();

			await user.save();

			emailVerification
				.send(user.email, user.name, verificationCode)
				.then(() => res.sendStatus(200))
				.catch((err) => {
					log.error("Error sending email", err);
					return res.sendStatus(500);
				});
		} catch (err) {
			log.error("Error sending verification email", err);
			return res.sendStatus(500);
		}
	}
);

/**
 * Verify Email
 */
router.post(
	"/verify-email",
	body("verificationCode").notEmpty(),
	async function (req, res) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			let user = await models.User.findOne({
				verification_code: req.body.verificationCode,
			});

			if (user == null) {
				return res.status(403).json({ message: "Verification code invalid" });
			}

			if (new Date() - user.last_verification_sent > 24 * 60 * 60 * 1000) {
				return res.status(410).json({ message: "Verification code expired" });
			}

			user.verified = true;
			await user.save();

			return res.sendStatus(200);
		} catch (err) {
			log.error("Error verifying email", err);
			return res.sendStatus(500);
		}
	}
);

/**
 * Send Forgot Password Email
 */
router.post(
	"/forgot-password",
	body("email").isEmail().toLowerCase(),
	async function (req, res) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			let user = await models.User.findOne({
				email: req.body.email,
			});

			if (user == null) {
				return res.status(404).json({ message: "User not found" });
			}

			if (new Date() - user.last_verification_sent < 2 * 60 * 1000) {
				return res
					.status(429)
					.json({ message: "Forgot password email sent already" });
			}

			let verificationCode = crypto
				.randomBytes(config.CRYPTO.SALT_BYTES)
				.toString("hex");

			user.verification_code = verificationCode;
			user.last_verification_sent = new Date();

			await user.save();

			forgotPasswordEmail
				.send(req.body.email, user.name, verificationCode)
				.then(() => res.sendStatus(200))
				.catch((err) => {
					log.error("Error sending email", err);
					return res.sendStatus(500);
				});
		} catch (err) {
			log.error("Error sending forgot password email", err);
			return res.sendStatus(500);
		}
	}
);

/**
 * Reset Password
 */
router.post(
	"/reset-password",
	body("verificationCode").notEmpty(),
	body("password").isLength({ min: 5 }),
	async function (req, res) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			let user = await models.User.findOne({
				verification_code: req.body.verificationCode,
			});

			if (user == null) {
				return res.status(403).json({ message: "Invalid verification code" });
			}

			if (!user.verified) {
				return res.status(403).json({ message: "User email not verified" });
			}

			if (new Date() - user.last_verification_sent > 24 * 60 * 60 * 1000) {
				return res.status(410).json({ message: "Verification code expired" });
			}

			crypto.pbkdf2(
				req.body.password,
				user.salt,
				config.CRYPTO.ITERATIONS,
				config.CRYPTO.HASH_BYTES,
				"sha512",
				function (err, hash) {
					if (err) {
						log.error("Error hashing password", err);
						return res.sendStatus(500);
					}

					user.hash = hash.toString("hex");

					user.save(function (err) {
						if (err) {
							log.error("Error saving user", err);
							return res.sendStatus(500);
						}

						return res.sendStatus(200);
					});
				}
			);
		} catch (err) {
			log.error("Error resetting password", err);
			return res.sendStatus(500);
		}
	}
);

module.exports = router;
