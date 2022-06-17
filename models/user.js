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

    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.methods.generateToken = function () {
  return jwt.sign(
    { _id: this._id, firstname: this.firstname },
    process.env.JWT_KEY,
    {
      expiresIn: Date.now() + 3600,
    }
  );
};
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  let salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

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

module.exports = { User, validateUser, validateUserLogin };
