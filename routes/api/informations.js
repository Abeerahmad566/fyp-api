const express = require("express");
let router = express.Router();
const auth = require("../../middleWares/auth");
const axios = require("axios");
var FormData = require('form-data');
const {Information} = require("../../models/information");
//get information
  router.get("/:id",async (req, res) => {
    let informations = await Information.find({userid:req.params.id});
    if(informations)
    return res.send(informations);
    else
    res.send("No info");
  });



//Insert a record
router.post("/", async (req, res) => {
  let information = new Information();
  information.userid = req.body.userid;
  information.age = req.body.age;
  information.income = req.body.income;
  information.carownership = req.body.carownership;
  information.currenthouseyears= req.body.currenthouseyears;
  information.married = req.body.married;
  information.profession=req.body.profession;
  information.currentjobyears=req.body.currentjobyears;
  information.experience=req.body.experience;
  information.Houseownership=req.body.Houseownership;
  information.result=req.body.result;
  await information.save();
  return res.send(information);
});

router.post("/predict",async (req, res) => {

 await axios.post("https://mlmodel-flask.herokuapp.com/predict",req.body  
  )
  .then((response) => {console.log(response)
  res.send(response.data)
  })
  .catch((error) => res.send(error));
});
module.exports = router;