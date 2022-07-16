const express = require("express");
const local = require("./local");
const facebook = require("./facebook");
const google = require("./google");
const jwt = require("./jwt");

const router = new express.Router();

local.init(router);
facebook.init(router);
google.init(router);

module.exports = { router, validateJwt: jwt.validateJwt };
