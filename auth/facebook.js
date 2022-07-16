const passport = require("passport");
const FbStrategy = require("passport-facebook").Strategy;
const jwt = require("jsonwebtoken");
const config = require("../config.json");
const log = require("../logger");
const models = require("../models");

passport.use(
	new FbStrategy(
		{
			clientID: config.FACEBOOK.CLIENT_ID,
			clientSecret: config.FACEBOOK.CLIENT_SECRET,
			callbackURL: `${config.BASE_URL}/auth/oauth/facebook/callback`,
			profileFields: ["emails", "displayName", "id"],
		},
		function (_, _, profile, cb) {
			models.User.findOne(
				{
					$or: [
						{ facebook_id: profile.id },
						{ email: profile.emails[0]?.value },
					],
				},
				function (err, user) {
					if (err) {
						log.error("Error searching user by facebook id", err);
						return cb(err);
					}

					if (user) {
						if (user.facebook_id == null) {
							user.facebook_id = profile.id;
							user.save();
						}

						return cb(null, user);
					} else if (profile.emails == null) {
						return cb(null, false, {
							message: "User has no verified email at Facebook",
						});
					} else {
						models.User.create(
							{
								name: profile.displayName,
								email: profile.emails[0].value,
								verified: true,
								facebook_id: profile.id,
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
		"/oauth/facebook",
		passport.authenticate("facebook", {
			session: false,
			scope: ["email", "public_profile"],
		})
	);

	router.get(
		"/oauth/facebook/callback",
		passport.authenticate("facebook", { session: false }),
		function (req, res) {
			const body = { _id: req.user._id };
			const token = jwt.sign({ user: body }, config.JWT.KEY);

			return res.redirect(`${config.JWT.TOKEN_CALLBACK_URL}?token=${token}`);
		}
	);
}

module.exports = { init };
