const { createLogger, format, transports } = require("winston");
const { combine, splat, timestamp, printf } = format;
const config = require("../config.json");

const myFormat = printf(({ level, message, timestamp, ...metadata }) => {
	let msg = `${timestamp} [${level}] : ${message} `;
	if (metadata && Object.keys(metadata).length > 0) {
		msg += JSON.stringify(metadata);
	}
	return msg;
});

const logger = createLogger({
	transports: [
		new transports.Console({
			level: "debug",
			format: combine(format.colorize(), splat(), timestamp(), myFormat),
		}),
		new transports.File({
			filename: config.LOG_PATH,
			level: "info",
			format: combine(splat(), timestamp(), myFormat),
		}),
	],
});
module.exports = logger;
