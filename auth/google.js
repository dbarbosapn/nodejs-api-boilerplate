const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const config = require("../config.json");
const log = require("../logger");
const models = require("../models");

passport.use(
	new GoogleStrategy(
		{
			clientID: config.GOOGLE.CLIENT_ID,
			clientSecret: config.GOOGLE.CLIENT_SECRET,
			callbackURL: `${config.BASE_URL}/auth/oauth/google/callback`,
		},
		function (_, _, profile, cb) {
			models.User.findOne(
				{
					$or: [{ google_id: profile.id }, { email: profile.emails[0]?.value }],
				},
				function (err, user) {
					if (err) {
						log.error("Error searching user by google id", err);
						return cb(err);
					}

					if (user) {
						if (user.facebook_id == null) {
							user.google_id = profile.id;
							user.save();
						}

						return cb(null, user);
					} else if (profile.emails == null) {
						return cb(null, false, {
							message: "User has no verified email at Google",
						});
					} else {
						models.User.create(
							{
								name: profile.displayName,
								email: profile.emails[0].value,
								verified: true,
								google_id: profile.id,
							},
							function (err, newUser) {
								if (err) {
									log.error("Error creating user", err);
									return cb(err);
								}

								return cb(null, newUser);
							}
						);
					}
				}
			);
		}
	)
);

function init(router) {
	router.get(
		"/oauth/google",
		passport.authenticate("google", {
			session: false,
			scope: ["profile", "email"],
		})
	);

	router.get(
		"/oauth/google/callback",
		passport.authenticate("google", { session: false }),
		function (req, res) {
			const body = { _id: req.user._id };
			const token = jwt.sign({ user: body }, config.JWT.KEY);

			return res.redirect(`${config.JWT.TOKEN_CALLBACK_URL}?token=${token}`);
		}
	);
}

module.exports = { init };
