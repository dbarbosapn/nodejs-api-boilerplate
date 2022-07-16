const passport = require("passport");
const passportJwt = require("passport-jwt");
const JwtStrategy = passportJwt.Strategy;
const ExtractJwt = passportJwt.ExtractJwt;
const config = require("../config.json");
const log = require("../logger");
const models = require("../models");

const options = {
	jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
	secretOrKey: config.JWT.KEY,
};

passport.use(
	new JwtStrategy(options, function (payload, cb) {
		models.User.findOne({ _id: payload.user._id }, function (err, user) {
			if (err) {
				log.error("Error searching user by id", err);
				return cb(err, false);
			}

			if (user) {
				if (!user.verified) {
					return cb(null, false, {
						message: "User's email is not verified",
						lastSent: user.last_verification_set,
					});
				}

				return cb(null, user);
			} else {
				return cb(null, false, { message: "Invalid JWT token" });
			}
		});
	})
);

function validateJwt() {
	return passport.authenticate("jwt", { session: false });
}

module.exports = { validateJwt };
