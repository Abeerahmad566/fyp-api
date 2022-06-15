const { array } = require("@hapi/joi");
var mongoose = require("mongoose");
var informationSchema = mongoose.Schema(
  {
    firstname: String,
    lastname: String,
    email: String,
    userid: String,
    age: Number,
    income: Number,
    carownership: String,
    currenthouseyears: Number,
    profession: String,
    currentjobyears: Number,
    married: String,
    experience: Number,
    Houseownership: String,
    result: String,
    photo: {
      type: Array,
    },
    cloudinary_id: {
      type: String,
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    address: String,
    cnic: String,
    designation: String,
    orgranizationname: String,
    organizationaddress: String,
    loanamount: Number,
    status: String,
    userRole: String,
    reason: {
      type: String,
      default: "Predicted By Admin",
    },
  },
  { timestamps: true }
);
var Information = mongoose.model("Information", informationSchema);
function validateinformation(data) {
  const schema = Joi.object({
    firstname: Joi.string().min(3).max(10).required(),
    lastname: Joi.string().min(3).max(10).required(),
    email: Joi.string().email().min(3).max(10).required(),
    age: Joi.number().min(0).max(3).required(),
    income: Joi.number().min(0).required(),
    carownership: Joi.string().min(2).max(2).required(),
    currenthouseyears: Joi.number().min(1).max(3).required(),
    profession: Joi.string().min(0).max(20).required(),
    currentjobyears: Joi.number().min(1).max(2).required(),
    married: joi.string.min(6).max(7).required(),
    experience: Joi.number().min(1).max(2).required(),
    Houseownership: Joi.number().min(2).max(2).required(),
    cnic: joi.string().min(15).max(15).required(),
    address: joi.string.min(10).required(),
    designation: joi.string.min(3).required(),
    orgranizationname: joi.string.min(3).required(),
    organizationaddress: joi.string.min(10).required(),
    loanamount: joi.Number.min(5).max(6).required(),
  });
  return schema.validate(data, { abortEarly: false });
}
module.exports.Information = Information;
module.exports.validate = validateinformation;
