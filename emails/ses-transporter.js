const nodemailer = require("nodemailer");
const aws = require("@aws-sdk/client-ses");
const config = require("../config.json");

process.env.AWS_ACCESS_KEY_ID = config.AWS.ACCESS_KEY_ID;
process.env.AWS_SECRET_ACCESS_KEY = config.AWS.SECRET_ACCESS_KEY;
const ses = new aws.SES({
	apiVersion: "2010-12-01",
	region: config.AWS.REGION,
});

module.exports = nodemailer.createTransport({
	SES: { ses, aws },
});
