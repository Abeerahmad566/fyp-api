const express = require("express");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
var dotenv = require("dotenv");
dotenv.config();
let router = express.Router();
let { User } = require("../../models/user");
var bcrypt = require("bcryptjs");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const config = require("config");
const crypto = require("crypto");
const sendEmail = require("./sendemail");
const multer = require("multer");
var path = require("path");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
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
// router.get("/stats", async (req, res) => {
//   const today = new Date();
//   const latYear = today.setFullYear(today.setFullYear() - 1);

//   try {
//     const data = await User.aggregate([
//       {
//         $project: {
//           month: { $month: "$createdAt" },
//         },
//       },
//       {
//         $group: {
//           _id: "$month",
//           total: { $sum: 1 },
//         },
//       },
//     ]);
//     res.status(200).json(data);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// });

const storage = multer.diskStorage({
  // destination: (req, file, cb) => {
  //   cb(null, './public');
  // },
  filename: (req, file, cb) => {
    const fileName = file.originalname.toLowerCase().split(" ").join("-");
    cb(null, mongoose.Types.ObjectId() + "-" + fileName);
    //cb(null, file.originalname);
  },
});
var upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
    }
  },
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
      await user.save();
      return res.send(user);
    } else {
      res.status(404);
      throw new Error("user not found");
    }
  }
);

router.put("/updateprofile/:id", async (req, res) => {
  let user = await User.findById(req.params.id);
  if (user) {
    user.firstname = req.body.firstname || user.firstname;
    user.lastname = req.body.lastname || user.lastname;
    user.phonenumber = req.body.phonenumber || user.phonenumber;

    await user.save();
    return res.send(user);
  } else {
    res.status(404);
    throw new Error("user not found");
  }
});
router.put("/updatepassword/:id", async (req, res) => {
  let user = await User.findById(req.params.id);
  if (user) {
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
router.post("/register", upload.single("photo"), async (req, res) => {
  let user = await User.findOne({ email: req.body.email });
  if (user)
    return res.status(400).json("User with Given Email Already Exsist ");
  const result = await cloudinary.uploader.upload(req.file.path);
  user = new User();
  user.firstname = req.body.firstname;
  user.lastname = req.body.lastname;
  user.email = req.body.email;
  user.phonenumber = req.body.phonenumber;
  user.password = req.body.password;
  req.body.role ? (user.role = req.body.role) : (user.role = "user");
  req.file ? (user.photo = result.secure_url) : (user.photo = "");
  user.cloudinary_id = result.public_id;
  let accessToken = user.generateToken(); //----->Genrate Token
  await user.save();
  let datatoRetuen = {
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    phonenumber: user.phonenumber,
    role: user.role,
    accessToken: accessToken,
  };
  res.status(200).json(datatoRetuen);
});
router.post("/login", async (req, res) => {
  let user = await User.findOne({ email: req.body.email });
  if (!user)
    return res.status(400).send("User With given Email is not Registered");
  let isValid = await bcrypt.compare(req.body.password, user.password);
  if (!isValid) return res.status(401).send("Invalid Password");
  let token = jwt.sign(
    {
      _id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
    },
    config.get("jwtPrivateKey")
  );
  res.send(token);
});

//Forget Password
router.post("/forgetpassword", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(404).json("User Not Exsist");
  }

  // Get ResetPassword Token
  const resetToken = user.getResetPasswordToken();

  await user.save();

  const resetPasswordUrl = `https://loanpredictionclient.netlify.app/passwordreset/${resetToken}`;

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
// router.post('/sendotp', async (req, res) => {
//   const user = await User.findOne({ email: req.body.email });
//   if (!user) return res.status(400).json('User Not Registered');
//   else {
//     //If user Exsist then send Otp to that user
//     let OTP = Math.floor(Math.random() * 10000 + 1).toString();
//     console.log(OTP);
//     console.log(user._id);
//     let newOtpExpiry = new Date(); // current time
//     let nowMinutes = newOtpExpiry.getMinutes();
//     newOtpExpiry.setMinutes(nowMinutes + 5);
//     console.log(newOtpExpiry);
//     await User.findByIdAndUpdate(user._id, {
//       otp: OTP,
//       otpExpiry: newOtpExpiry,
//     });

//     const message = `
//       <h4>Hi,</h4>
//       <p>You're recieving this email because we've recieved a password reset request from your account. If you didn't request a password reset, no further action is required.</p>
//       <p>Your OTP is this:</p>
//       <p>${OTP}</p>
//     `;
//     try {
//       await sendEmail({
//         to: user.email,
//         subject: `Password Reset Request`,
//         text: message,
//       });
//       res.status(200).json({
//         message: `Email sent to ${user.email} successfully`,
//       });
//     } catch (error) {
//       return res.status(500).json(' Email Could Not be  Send');
//     }
//   }
// });
module.exports = router;
