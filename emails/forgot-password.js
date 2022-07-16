const sender = require("./sender");
const config = require("../config.json");

function send(to, name, verificationCode) {
	return sender.send({
		template: "forgot-password",
		message: {
			to: to,
		},
		locals: {
			name: name,
			link: `${config.REDIRECT_URL}/reset-password?code=${verificationCode}`,
			app: config.APP_NAME,
		},
	});
}

module.exports = { send };
