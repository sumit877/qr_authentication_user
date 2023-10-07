// routes/api.js

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../model/User");
const QRCode = require("../model/qrCode");
const ConnectedDevice = require("../model/connectedDevice");
const router = express.Router();

// ... (Add your API routes here)
const {
    registerUser,
    loginUser,
    generateQRCode,
    scanQRCode,
    createUser,
    updateUser,
    deleteUser,
    getUserDetailsFromToken,
    scanQRCodeAndRetrieveUser,
  } = require("../controllers/controller");
  
  // User registration route
  router.post("/register", registerUser);
  
  // User login route
  router.post("/login", loginUser);
  
  // Generate QR code route
  router.post("/qr/generate", generateQRCode);
  
  // Scan and validate QR code route
  router.post("/qr/scan", scanQRCode);

  // Scan qr and retrieve data
  router.post('/scanqr', scanQRCodeAndRetrieveUser);
  
  // Admin create user route
  router.post("/admin/create-user", createUser);
  
  // Admin update user route
  router.put("/admin/update-user/:userId", updateUser);
  
  // Admin delete user route
  router.delete("/admin/delete-user/:userId", deleteUser);


module.exports = router;
