const Email = require("email-templates");
const sesTransporter = require("./ses-transporter");
const config = require("../config.json");
const path = require("path");

module.exports = new Email({
	message: {
		from: config.AWS.SOURCE_EMAIL,
	},
	views: {
		root: path.resolve("emails", "templates"),
	},
	// uncomment below to send emails in development/test env:
	send: true,
	transport: sesTransporter,
});
