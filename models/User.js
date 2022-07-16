const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		hash: { type: String },
		salt: { type: String },
		verified: { type: Boolean, default: false },
		verification_code: { type: String },
		last_verification_sent: { type: Date },
		facebook_id: { type: String },
		google_id: { type: String },
	},
	{
		query: {
			hideSensitive() {
				return this.select("name email verified");
			},
		},
	}
);

const User = mongoose.model("User", UserSchema, "users");

module.exports = User;
