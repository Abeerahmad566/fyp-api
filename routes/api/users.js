const express = require("express");
let router = express.Router();
let { User } = require("../../models/user");
var bcrypt = require("bcryptjs");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const config = require("config");
const crypto = require('crypto');
const sendEmail = require("./sendemail")
const { response } = require("../../app");
router.get("/",async (req, res) => {
  console.log(req.user);
  let users = await User.find();
  return res.send(users);
});
router.post('/register',  async (req, res) => {
  console.log(req.body);

  let user = await User.findOne({ email: req.body.email });
  if (user)
    return res.status(400).json('User with Given Email Already Exsist ');
  user = new User();
  (user.firstname = req.body.firstname),
  (user.lastname = req.body.lastname),
    (user.email = req.body.email),
    (user.phonenumber = req.body.phonenumber),
    (user.password = req.body.password);
  let accessToken = user.generateToken(); //----->Genrate Token
  await user.save();
  //const { password, ...info } = user._doc;
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
  if (!user) return res.status(400).send("User With given Email is not Registered");
  let isValid = await bcrypt.compare(req.body.password, user.password);
  if (!isValid) return res.status(401).send("Invalid Password");
  let token = jwt.sign(
    { _id: user._id, email: user.email, name: user.firstname },
    config.get("jwtPrivateKey")
  );
  res.send(token);
});

//Forget Password
router.post('/forgetpassword', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(404).json('User Not Exsist');
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

    return res.status(500).json(' Email Could Not be  Send');
  }
});

//Reset Password Route

router.put('/passwordreset/:resetToken', async (req, res) => {
  //Hash the token which is provides in the url and generate the new token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    //Check that Token is Expired or not
    if (!user) {
      return res.status(400).json('Token is Expired or Invalid');
    }
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(201).json({
      success: true,
      data: 'Password Updated Success',
      //token: user.generateToken(),
    });
  } catch (error) {
    console.log(error);
  }
});
module.exports = router;

