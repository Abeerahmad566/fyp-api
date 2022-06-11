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
router.get("/stats", async (req, res) => {
  const today = new Date();
  const latYear = today.setFullYear(today.setFullYear() - 1);

  try {
    const data = await Information.aggregate([
      {
        $project: {
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: 1 },
        },
      },
    ]);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});
router.get("/get/totalprediction", async (req, res) => {
  try {
    var count = 0;
    let informations = await Information.find();
    const total = informations;
    count = total.length;

    return res.status(200).json(count);
  } catch (err) {
    return res.status(500).json("Internal Server Error");
  }
});
router.get("/get/totalApproved", async (req, res) => {
  try {
    var count = 0;
    let informations = await Information.find({ result: "Approved" });
    const total = informations;
    count = total.length;

    return res.status(200).json(count);
  } catch (err) {
    return res.status(500).json("Internal Server Error");
  }
});
router.get("/get/totalRejected", async (req, res) => {
  try {
    var count = 0;
    let informations = await Information.find({ result: "Rejected" });
    const total = informations;
    count = total.length;

    return res.status(200).json(count);
  } catch (err) {
    return res.status(500).json("Internal Server Error");
  }
});
router.get("/pendingloandata", async (req, res) => {
  let informations = await Information.find({ status: "Pending" });
  return res.send(informations);
});
router.get("/", async (req, res) => {
  let informations = await Information.find();
  return res.send(informations);
});
//get information
router.get("/:id", async (req, res) => {
  let informations = await Information.find({
    userid: req.params.id,
    result: "Approved" || "Rejected",
  });
  if (informations) return res.send(informations);
  else res.send("No info");
});
//delete information
router.delete("/:id", async (req, res) => {
  let information = await Information.findByIdAndDelete(req.params.id);
  return res.send(information);
});
//Insert a record'

router.get("/getuserspictures/:id", async (req, res) => {
  let informations = await Information.findById(req.params.id);
  if (informations) return res.send(informations);
  else res.send("No info");
});

router.post("/", upload.array("photo", 10), async (req, res) => {
  const reqFiles = [];
  const url = req.protocol + "://" + req.get("host");

  for (var i = 0; i < req.files.length; i++) {
    reqFiles.push(url + "/images/" + req.files[i].filename);
  }
  let information = new Information();
  information.userid = req.body.userid;
  information.firstname = req.body.firstname;
  information.lastname = req.body.lastname;
  information.email = req.body.email;
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
  information.photo = reqFiles;
  information.loanamount = req.body.loanamount;
  information.result = req.body.result;
  information.status = req.body.status;
  information.userRole = req.body.userRole;
  await information.save();
  return res.send(information);
});
router.put("/updatestatus/:id", async (req, res) => {
  console.log(req.params);
  let information = await Information.findOne({ _id: req.params.id });

  try {
    console.log(req.body);
    information.status = req.body.status || information.status;
    await information.save();
    return res.send(information);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});
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
