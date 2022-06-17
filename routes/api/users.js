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
const Token = require("../../models/token");
dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, fileName + "-" + Date.now());
  },
});

const fileFilter = (req, file, cb) => {
  // reject a file
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpeg"
  ) {
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
  try {
    let user = await User.findOne({ email: req.body.email });
    if (user)
      return res.status(400).json("User with Given Email Already Exist ");
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
    const token = await new Token({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex"),
    }).save();
    const url = `${process.env.BASE_URL}${user.id}/emailverify/${token.token}`;
    await sendEmail(user.email, "Verify Email", url);

    res
      .status(201)
      .send({ message: "An Email sent to your account please verify" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

router.get("/:id/emailverify/:token", async (req, res) => {
  console.log(req.params);
  try {
    const user = await User.findById(req.params.id);
    console.log(user);
    if (!user) return res.status(400).send({ message: "Invalid link" });
    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });
    if (!token)
      return res.status(401).send({ message: "Email Already Verified" });

    await User.findById(req.params.id);
    if (user) {
      user.verified = true;
      await token.remove();
      await user.save();
      return res.status(200).json({ message: "Email verified successfully" });
    } else {
      res.status(404);
      throw new Error("user not found");
    }
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error" });
  }
});

router.post("/login", async (req, res) => {
  let user = await User.findOne({ email: req.body.email });
  if (!user)
    return res.status(400).send("User With given Email is not Registered");
  let isValid = await bcrypt.compare(req.body.password, user.password);
  if (!isValid) return res.status(401).send("Invalid Password");

  if (!user.verified) {
    let token = await Token.findOne({ userId: user._id });
    if (!token) {
      token = await new Token({
        userId: user._id,
        token: crypto.randomBytes(32).toString("hex"),
      }).save();
      const url = `${process.env.BASE_URL}${user._id}/emailverifylogin/${token.token}`;
      await sendEmail(user.email, "Verify Email Login", url);
    }
    return res
      .status(402)
      .send({ message: "An Email sent to your account please verify" });
  }

  let token = jwt.sign(
    {
      _id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
      photo: user.photo,
    },
    config.get("jwtPrivateKey"),
    {
      expiresIn: Date.now() + 3600,
    }
  );
  res.send(token);
});

///Forget Password
router.post("/forgetpassword", async (req, res) => {
  console.log(req.body);
  try {
    let user = await User.findOne({ email: req.body.email });
    if (!user)
      return res
        .status(402)
        .send({ message: "User with given email does not exist!" });

    let token = await Token.findOne({ userId: user._id });
    if (!token) {
      token = await new Token({
        userId: user._id,
        token: crypto.randomBytes(32).toString("hex"),
      }).save();
    }

    const url = `${process.env.BASE_URL}newpassword/${user._id}/${token.token}`;
    await sendEmail(
      user.email,
      `Loan Prediction Website Password Recovery`,
      url
    );
    console.log(user.email);
    res
      .status(200)
      .json({ message: "Password reset link sent to your email account" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error" });
  }
});
router.post("/newpassword/:id/:token", async (req, res) => {
  console.log(req.body);
  try {
    const user = await User.findOne({ _id: req.params.id });
    if (!user) return res.status(400).send({ message: "Invalid link" });

    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });
    if (!token) return res.status(400).send({ message: "Invalid link" });

    if (!user.verified) user.verified = true;

    user.password = req.body.password;
    await user.save();
    await token.remove();

    res.status(200).send({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error" });
  }
});

module.exports = router;
