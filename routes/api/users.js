const express = require("express");
let router = express.Router();
let { User } = require("../../models/user");
var bcrypt = require("bcryptjs");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const config = require("config");
const crypto = require("crypto");
const sendEmail = require("./sendemail");
const { response } = require("../../app");
const multer = require("multer");
var path = require("path");

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

router.put(
  "/updateprofileimg/:id",
  upload.single("photo"),
  async (req, res) => {
    let user = await User.findById(req.params.id);
    if (user) {
      user.photo = req.file.path;
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
  user = new User();
  user.firstname = req.body.firstname;
  user.lastname = req.body.lastname;
  user.email = req.body.email;
  user.phonenumber = req.body.phonenumber;
  user.password = req.body.password;
  req.file ? (user.photo = req.file.path) : (user.photo = "");
  let accessToken = user.generateToken(); //----->Genrate Token
  await user.save();
  let datatoRetuen = {
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    phonenumber: user.phonenumber,
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
  let token = jwt.sign({ _id: user._id }, config.get("jwtPrivateKey"));
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
module.exports = router;
