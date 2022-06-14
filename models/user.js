var mongoose = require("mongoose");
var bcrypt = require("bcryptjs");
const Joi = require("@hapi/joi");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
var userSchema = mongoose.Schema(
  {
    firstname: String,
    lastname: String,
    email: String,
    phonenumber: Number,
    password: String,
    photo: {
      type: String,
    },
    cloudinary_id: {
      type: String,
    },
    role: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    verifyemailToken: String,
    verifyemailExpire: Date,
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

//Hash the Password

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  let salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

//generate the token
userSchema.methods.generateToken = function () {
  return jwt.sign(
    { _id: this._id, firstname: this.firstname },
    process.env.JWT_KEY
  );
};

//Generate the Reset Password Token
userSchema.methods.getResetPasswordToken = function () {
  //Generate the Reset Token
  const resetToken = crypto.randomBytes(20).toString("hex");

  //Hash the Above Reset Token add the resetpasswordtoken to user Schema
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  //Assign the resetpasswordToken Expire Time
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

//Generate the email verify Token
userSchema.methods.getverifyemailToken = function () {
  //Generate the Reset Token
  const emailverifyToken = crypto.randomBytes(20).toString("hex");

  //Hash the Above Reset Token add the verifyemailToken to user Schema
  this.verifyemailToken = crypto
    .createHash("sha256")
    .update(emailverifyToken)
    .digest("hex");

  //Assign the emailverifyToken Expire Time
  this.verifyemailExpire = Date.now() + 60 * 1000;
  return emailverifyToken;
};
function validateUserReset(data) {
  const schema = Joi.object({
    password: Joi.string().min(5).max(10).required(),
  });
  return schema.validate(data, { abortEarly: false });
}

var User = mongoose.model("User", userSchema);
function validateUser(data) {
  const schema = Joi.object({
    firstname: Joi.string().min(3).max(10).required(),
    lastname: Joi.string().min(3).max(10).required(),
    email: Joi.string().email().min(3).max(10).required(),
    phonenumber: Joi.number().min(11).max(11).required(),
    password: Joi.string().min(3).max(10).required(),
  });
  return schema.validate(data, { abortEarly: false });
}
function validateUserLogin(data) {
  const schema = Joi.object({
    email: Joi.string().email().min(3).max(10).required(),
    password: Joi.string().min(3).max(10).required(),
  });
  return schema.validate(data, { abortEarly: false });
}

module.exports = { User, validateUser, validateUserLogin, validateUserReset };
