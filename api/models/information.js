var mongoose = require("mongoose");
var informationSchema = mongoose.Schema({
  
userid:String,
age: Number,
income: Number,
carownership:String,
currenthouseyears:Number,
profession:String,
currentjobyears: Number,
married:String,
experience: Number,
Houseownership: String,
result:String,

});
var Information = mongoose.model("Information", informationSchema);
function validateinformation(data) {
    const schema = Joi.object({
        age: Joi.number().min(0).max(3).required(),
        income: Joi.number().min(0).required(),
        carownership: Joi.string().min(2).max(2).required(),
        currenthouseyears: Joi.number().min(1).max(3).required(),
        profession: Joi.string().min(0).max(20).required(),
        currentjobyears: Joi.number().min(1).max(2).required(),
    married:joi.string.min(6).max(7).required(),
        experience: Joi.number().min(1).max(2).required(),
        Houseownership: Joi.number().min(2).max(2).required(),    
    });
    return schema.validate(data, { abortEarly: false });
  }
  module.exports.Information = Information;
  module.exports.validate = validateinformation;
  

