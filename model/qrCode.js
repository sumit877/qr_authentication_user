// model/qrCode.js

const mongoose = require("mongoose");

const qrCodeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  connectedDeviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ConnectedDevice",
  },
  lastUsedDate: { type: Date, default: new Date(Date.now()) },
  isActive: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

module.exports = mongoose.model("QRCode", qrCodeSchema);
