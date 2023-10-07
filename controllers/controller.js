const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../model/User");
const QRCode = require("../model/qrCode");
const ConnectedDevice = require("../model/connectedDevice");
const qrcode = require('qrcode');



// User registration controller
const registerUser = async (req, res) => {
  
    try {
        const { first_name, last_name, email, password } = req.body;
    
        // Validate user input
        if (!(email && password && first_name && last_name)) {
          return res.status(400).json({ error: "All input is required" });
        }
    
        // Check if user already exists
        const oldUser = await User.findOne({ email });
    
        if (oldUser) {
          return res.status(409).json({ error: "User Already Exist. Please Login" });
        }
    
        // Encrypt user password
        const encryptedPassword = await bcrypt.hash(password, 10);
    
        // Create user in the database
        const user = await User.create({
          first_name,
          last_name,
          email: email.toLowerCase(),
          password: encryptedPassword,
        });
    
        // Create token
        const token = jwt.sign(
          { user_id: user._id, email },
          process.env.TOKEN_KEY,
          { expiresIn: "2h" }
        );
    
        // Return the token
        return res.status(201).json({ success:true, message:"User Registered Successfully", token });
      } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Registration failed" });
  }
};

// User login controller
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
    
        // Validate user input
        if (!(email && password)) {
          return res.status(400).json({ error: "All input is required" });
        }
    
        // Validate if user exists in the database
        const user = await User.findOne({ email });
    
        if (user && (await bcrypt.compare(password, user.password))) {
          // Create token
          const token = jwt.sign(
            { user_id: user._id, email },
            process.env.TOKEN_KEY,
            { expiresIn: "2h" }
          );
    
          // Save user token (if needed)
          user.token = token;
    
          // Return the token
          return res.status(200).json({success:true, message:"User Logged In Successfully", token });
        }
    
        return res.status(400).json({ error: "Invalid Credentials" });
      } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed" });
  }
};

// Generate QR code controller
const generateQRCode = async (req, res) => {
  try {
    const { userId } = req.body;

    // Validate user input
    if (!userId) {
      return res.status(400).json({ error: "User Id is required" });
    }

    // Validate if user exists in the database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const qrExist = await QRCode.findOne({ userId });

    // If a QR code exists, update 'disabled' to true and create a new QR record; otherwise, create a new one
    if (!qrExist) {
      await QRCode.create({ userId: user._id, isActive: true });
    } else {
      await QRCode.findOneAndUpdate({ userId }, { $set: { disabled: true } });
      await QRCode.create({ userId: user._id, isActive: true });
    }

    // Generate encrypted data
    const encryptedData = jwt.sign({ userId: user._id, email: user.email }, process.env.TOKEN_KEY, {
      expiresIn: "1d",
    });

    // Generate QR code
    const dataImage = await qrcode.toDataURL(encryptedData);

    // Return the QR code image
    return res.status(200).json({success:true, message:"QR Code generated Successfully.", dataImage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "QR code generation failed" });
  }
};

module.exports = {
  generateQRCode,
};


// Scan and validate QR code controller

const scanQRCode = async (req, res) => {
  try {
    const { token, deviceInformation } = req.body;

    // Validate user input
    if (!token || !deviceInformation) {
      return res.status(400).json({ error: "Token and deviceInformation are required" });
    }

    // Verify the token to get user information
    const decoded = jwt.verify(token, process.env.TOKEN_KEY);

    console.log("Decoded data:",decoded);
    // Find the corresponding QR code record
    const qrCode = await QRCode.findOne({
      userId: decoded.user_id,
      disabled: false,
    });

    console.log("Printing QR COde",qrCode);

    if (!qrCode) {
      return res.status(400).json({ error: "QR Code not found or has been disabled" });
    }

    console.log("QR code ki id:",qrCode.id);
    console.log("QR ME user ki id:",qrCode.userId)
    // Create a connected device record
    const connectedDeviceData = {
      userId: qrCode.userId,
      qrCodeId: qrCode.id,
      deviceName: deviceInformation.deviceName,
      deviceModel: deviceInformation.deviceModel,
      deviceOS: deviceInformation.deviceOS,
      deviceVersion: deviceInformation.deviceVersion,
    };
    

    // Save the connected device record
    // Replace 'ConnectedDevice' with your connected device model
    const connectedDevice = await ConnectedDevice.create(connectedDeviceData);

    // Update the QR code record
    await QRCode.findOneAndUpdate(
      { id: qrCode._id },
      {
        isActive: true,
        lastUsedDate: new Date(),
      }
    );

    // Find the user (if needed)
    const user = await User.findById(decoded.userId);

    // Create a new token (if needed)
    // const authToken = jwt.sign({ user_id: user._id }, process.env.TOKEN_KEY, {
    //   expiresIn: "2h",
    // });

    // Return a response as needed
    return res.status(200).json({ success:true, message: "QR code scanned and validated successfully"});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "QR code scanning failed" });
  }
};

// geting user data on scan qr
const scanQRCodeAndRetrieveUser = async (req, res) => {
  try {
    const { token } = req.body; // Assuming the QR code payload is sent as 'token'

    // Validate user input
    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    // Verify the token to get user information
    const decoded = jwt.verify(token, process.env.TOKEN_KEY);

    // Find the user in the database by ID (you can use any unique identifier)
    const user = await User.findById(decoded.user_id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Send the user details as a response
    return res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "QR code scanning and user retrieval failed" });
  }
};


// Admin create user controller
const createUser = async (req, res) => {
  try {
    // Extract user input from the request body
    const { firstName, lastName, email, password } = req.body;

    // Validate user input (you can add more validation as needed)
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if the user with the same email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ error: "User with this email already exists" });
    }

    // Create a new user document in your database
    const newUser = new User({
      first_name: firstName,
      last_name: lastName,
      email,
      password, // You should hash the password before saving it
    });

    // Save the user document
    await newUser.save();

    // Respond with a success message or user details
    return res.status(201).json({ success: true, message: "User created successfully", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "User creation failed" });
  }
};

// Admin update user controller
const updateUser = async (req, res) => {
  try {
    // Extract user input from the request body
    const { userId, firstName, lastName, email, password } = req.body;

    // Validate user input (you can add more validation as needed)
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Check if the user with the specified ID exists
    const userToUpdate = await User.findById(userId);

    if (!userToUpdate) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update user properties as needed
    if (firstName) {
      userToUpdate.first_name = firstName;
    }

    if (lastName) {
      userToUpdate.last_name = lastName;
    }

    if (email) {
      userToUpdate.email = email;
    }

    if (password) {
      // You should hash the new password before saving it
      userToUpdate.password = password;
    }

    // Save the updated user document
    await userToUpdate.save();

    // Respond with a success message or updated user details
    return res.status(200).json({ success: true, message: "User updated successfully", user: userToUpdate });
  }  catch (error) {
    console.error(error);
    res.status(500).json({ error: "User update failed" });
  }
};

// Admin delete user controller
const deleteUser = async (req, res) => {
  try {
    // Extract the user ID from the request parameters or request body
    // const { userId } = req.params; // If you're passing the user ID as a URL parameter
    const { userId } = req.body; // If you're passing the user ID in the request body

    // Check if the user ID is provided
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Find and delete the user by their ID
    const deletedUser = await User.findByIdAndDelete(userId);

    // Check if the user was found and deleted
    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return a success message
    return res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "User deletion failed" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  generateQRCode,
  scanQRCode,
  createUser,
  updateUser,
  deleteUser,
  scanQRCodeAndRetrieveUser
};
