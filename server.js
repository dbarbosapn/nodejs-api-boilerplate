const config = require("./config.json");
const mongoose = require("mongoose");
const express = require("express");
const log = require("./logger");
const auth = require("./auth");
const routes = require("./routes");

/* Setup Database */
log.info("Connecting to the database...");
mongoose.connect(
	`mongodb+srv://${config.MONGODB.USERNAME}:${config.MONGODB.PASSWORD}@${config.MONGODB.HOST}/${config.MONGODB.DB_NAME}?retryWrites=true&w=majority`,
	() => {
		log.info("Connected to the database successfully!");
	}
);

/* Setup HTTP Server */
const app = express();

app.use(express.json());

app.use("/auth", auth.router);
app.use("/users", routes.usersRoute);

app.get("/", function (_, res) {
	res.send("Nothing to see here :)");
});

app.listen(config.PORT, function (err) {
	if (err) {
		log.error(
			`Error occurred when starting HTTP server on port ${config.PORT}`,
			err
		);
	} else {
		log.info(`Server started on port ${config.PORT}`);
	}
});
