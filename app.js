// app.js

const express = require("express");
const app = express();
const { connect } = require("./config/database");
const apiRoutes = require("./routes/api");
require("dotenv").config();
const PORT = process.env.API_PORT || 4000;
const cors = require('cors');

// Connect to the database
connect();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/v1", apiRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


