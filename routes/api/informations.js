const express = require("express");
let router = express.Router();
const auth = require("../../middleWares/auth");
const axios = require("axios");
var FormData = require("form-data");
const { Information } = require("../../models/information");
const multer = require("multer");
var path = require("path");
const { info } = require("console");

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

//get information
router.get("/:id", async (req, res) => {
  let informations = await Information.find({ userid: req.params.id });
  if (informations) return res.send(informations);
  else res.send("No info");
});
//delete information
router.delete("/:id", async (req, res) => {
  let information = await Information.findByIdAndDelete(req.params.id);
  return res.send(information);
});
//Insert a record
router.post(
  "/",
  upload.single("cardphoto"),
  upload.array("billsphoto", 10),
  upload.array("cnicphoto", 2),
  async (req, res) => {
    const reqFilescnic = [];

    const urlcnic = req.protocol + "://" + req.get("host");

    for (var i = 0; i < req.files.length; i++) {
      reqFilescnic.push(urlcnic + "/images/" + req.files[i].filename);
    }
    const reqFilesbill = [];

    const urlbill = req.protocol + "://" + req.get("host");

    for (var i = 0; i < req.files.length; i++) {
      reqFilesbill.push(urlbill + "/images/" + req.files[i].filename);
    }
    let information = new Information();
    information.userid = req.body.userid;
    information.age = req.body.age;
    information.income = req.body.income;
    information.carownership = req.body.carownership;
    information.currenthouseyears = req.body.currenthouseyears;
    information.married = req.body.married;
    information.profession = req.body.profession;
    information.currentjobyears = req.body.currentjobyears;
    information.experience = req.body.experience;
    information.Houseownership = req.body.Houseownership;
    information.cnic = req.body.cnic;
    information.address = req.body.address;
    information.amount = req.body.amount;
    information.cnicphoto = reqFilescnic;
    information.cardphoto = req.file.path;
    information.billsphoto = reqFilesbill;
    information.amount = req.body.amount;
    information.result = req.body.result;
    await information.save();
    return res.send(information);
  }
);

router.post("/predict", async (req, res) => {
  await axios
    .post("https://mlmodel-flask.herokuapp.com/predict", req.body)
    .then((response) => {
      console.log(response);
      res.send(response.data);
    })
    .catch((error) => res.send(error));
});
module.exports = router;
