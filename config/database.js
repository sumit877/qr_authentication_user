// config/database.js

const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const MONGO_URI = process.env.MONGO_URI;

exports.connect = () => {
  mongoose
    .connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("Successfully connected to the database");
    })
    .catch((error) => {
      console.log("Database connection failed. Exiting now...");
      console.error(error);
      process.exit(1);
    });
};
