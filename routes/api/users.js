const express = require("express");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const axios = require("axios");
let router = express.Router();
let { User } = require("../../models/user");
var bcrypt = require("bcryptjs");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const config = require("config");
const crypto = require("crypto");
const sendEmail = require("./sendemail");
const multer = require("multer");
var dotenv = require("dotenv");
dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
<<<<<<< HEAD
=======
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "./images/");
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.originalname);
//   },
// });

// const fileFilter = (req, file, cb) => {
//   // reject a file
//   if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
//     cb(null, true);
//   } else {
//     cb(null, false);
//   }
// };

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 1024 * 1024 * 5,
//   },
//   fileFilter: fileFilter,
// });
// router.get("/get/totalusers", async (req, res) => {
//   try {
//     var count = 0;
//     let users = await User.find();
//     const total = users.filter((user) => user.role === "user");
//     count = total.length;

//     return res.status(200).json(count);
//   } catch (err) {
//     return res.status(500).json("Internal Server Error");
//   }
// });

>>>>>>> 3c084e918634989d77a6e5412f09264e2d4dc187
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./images/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  // reject a file
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter: fileFilter,
});

router.get("/:id", async (req, res) => {
  let user = await User.findById(req.params.id);
  return res.send(user);
});
router.get("/users", async (req, res) => {
  let users = await User.find({ role: "user" });
  return res.send(users);
});
router.get("/admins", async (req, res) => {
  let users = await User.find({ role: "admin" });
  return res.send(users);
});
router.get("/", async (req, res) => {
  let users = await User.find();
  return res.send(users);
});
router.delete("/:id", async (req, res) => {
  let user = await User.findByIdAndDelete(req.params.id);
  return res.send(user);
});
router.put(
  "/updateprofileimg/:id",
  upload.single("photo"),
  async (req, res) => {
    const result = await cloudinary.uploader.upload(req.file.path);
    let user = await User.findById(req.params.id);
    if (user) {
      user.photo = result.secure_url;
      user.cloudinary_id = result.public_id;
      await user.save();
      return res.send(user);
    } else {
      res.status(404);
      throw new Error("user not found");
    }
  }
);

router.put("/updateprofile/:id", async (req, res) => {
  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).json("User with Given Email Already Exist ");
  try {
    user = await User.findById(req.params.id);
    user.email = req.body.email || user.email;
    user.firstname = req.body.firstname || user.firstname;
    user.lastname = req.body.lastname || user.lastname;
    user.phonenumber = req.body.phonenumber || user.phonenumber;

    await user.save();
    return res.send(user);
  } catch (error) {
    return res.status(404).json("user not found");
  }
});
router.put("/updatepassword/:id", async (req, res) => {
  let user = await User.findById(req.params.id);
  if (user) {
    let isValid = await bcrypt.compare(req.body.oldpassword, user.password);
    if (!isValid) return res.status(401).send("Invalid old Password");
    console.log(req.body);
    user.password = req.body.password;
    await user.save();
    return res.send(user);
  } else {
    res.status(404);
    throw new Error("user not found");
  }
});

router.get("/:id", async (req, res) => {
  let users = await User.find({ _id: req.params.id });
  return res.send(users);
});
router.post("/email", async (req, res) => {
  let user = await User.findOne({ email: req.params.email });
  return res.send(user);
});
router.post("/register", upload.single("photo"), async (req, res) => {
  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).json("User with Given Email Already Exist ");
  let result = "";
  req.file
    ? (result = await cloudinary.uploader.upload(req.file.path))
    : (result = cloudinary.uploader.upload(""));

  user = new User();
  user.firstname = req.body.firstname;
  user.lastname = req.body.lastname;
  user.email = req.body.email;
  user.phonenumber = req.body.phonenumber;
  user.password = req.body.password;
  req.body.role ? (user.role = req.body.role) : (user.role = "user");
  user.photo = result.secure_url;
  user.cloudinary_id = result.public_id;
  let accessToken = user.generateToken(); //----->Genrate Token
  let datatoreturn = {
    id: user._id,
    accessToken: accessToken,
    photo: user.photo,
    cloudinary_id: user.cloudinary_id,
  };
  await user.save();
  res.status(200).json(datatoreturn);
});

router.post("/login", async (req, res) => {
  let user = await User.findOne({ email: req.body.email });
  if (!user)
    return res.status(400).send("User With given Email is not Registered");
  let isValid = await bcrypt.compare(req.body.password, user.password);
  if (!isValid) return res.status(401).send("Invalid Password");
  if (!user.verified) return res.status(402).send("Please Verify Your Email");
  let token = jwt.sign(
    {
      _id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
      photo: user.photo,
    },
    config.get("jwtPrivateKey")
  );
  res.send(token);
});

<<<<<<< HEAD
=======
//Forget Password
router.post("/forgetpassword", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(404).json("User Not Exist");
  }

  // Get ResetPassword Token
  const resetToken = user.getResetPasswordToken();

  await user.save();

  const resetPasswordUrl = `http://localhost:3000/passwordreset/${resetToken}`;

  const message = `
     <h1>You have requested a password reset</h1>
     <p>Please make a put request to the following link:</p>
     <a href=${resetPasswordUrl} clicktracking=off>${resetPasswordUrl}</a>
   `;

  try {
    await sendEmail({
      to: user.email,
      subject: `Loan Prediction Website Password Recovery`,
      text: message,
    });

    res.status(200).json({
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return res.status(500).json(" Email Could Not be  Send");
  }
});

//Reset Password Route

router.put("/passwordreset/:resetToken", async (req, res) => {
  //Hash the token which is provides in the url and generate the new token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");

  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    //Check that Token is Expired or not
    if (!user) {
      return res.status(400).json("Token is Expired or Invalid");
    }
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(201).json({
      success: true,
      data: "Password Updated Success",
    });
  } catch (error) {
    console.log(error);
  }
});
>>>>>>> 3c084e918634989d77a6e5412f09264e2d4dc187
module.exports = router;
