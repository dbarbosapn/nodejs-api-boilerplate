const sender = require("./sender");
const config = require("../config.json");

function send(to, name, verificationCode) {
	return sender.send({
		template: "email-verification",
		message: {
			to: to,
		},
		locals: {
			name: name,
			link: `${config.REDIRECT_URL}/verify-email?code=${verificationCode}`,
			app: config.APP_NAME,
		},
	});
}

module.exports = { send };
