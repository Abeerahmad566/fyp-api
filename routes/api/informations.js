const express = require("express");
let router = express.Router();
const auth = require("../../middleWares/auth");
const mongoose = require("mongoose");
const axios = require("axios");
const { Information } = require("../../models/information");
const multer = require("multer");
var path = require("path");
const { info } = require("console");
const cloudinary = require("cloudinary").v2;
var dotenv = require("dotenv");
dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, file + "-" + Date.now());
  },
});
var upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
    }
  },
});
router.get("/allpredictions", async (req, res) => {
  try {
    const allpredictions = await Information.aggregate([
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
    res.status(200).json(allpredictions);
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
router.get("/get/totalpendingloans", async (req, res) => {
  try {
    var count = 0;
    let informations = await Information.find({ status: "Pending" });
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
const cloudinaryImageUploadMethod = async (file) => {
  return new Promise((resolve) => {
    cloudinary.uploader.upload(file, (err, res) => {
      if (err) return res.status(500).send("upload image error");
      resolve({
        res: res.secure_url,
      });
    });
  });
};

router.post("/", upload.array("photo", 10), async (req, res) => {
  console.log(req.body);
  let information = new Information();
  const urls = [];
  const files = req.files;
  for (const file of files) {
    const { path } = file;
    const newPath = await cloudinaryImageUploadMethod(path);
    urls.push(newPath);
    information.photo = urls.map((url) => url.res);
    information.cloudinary_id = newPath.public_id;
  }

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
  req.body.result = "Rejected"
    ? (information.reason = "Rejected by System ")
    : (information.reason = req.body.reason);
  information.designation = req.body.designation;
  information.orgranizationname = req.body.orgranizationname;
  information.organizationaddress = req.body.organizationaddress;
  information.loanamount = req.body.loanamount;
  information.result = req.body.result;
  information.status = req.body.status;
  information.userRole = req.body.userRole;
  information.tenure = req.body.tenure;
  await information.save();
  return res.send(information);
});
router.put("/updatestatus/:id", async (req, res) => {
  let information = await Information.findOne({ _id: req.params.id });

  try {
    console.log(req.body);
    information.status = req.body.status || information.status;
    information.reason = req.body.reason || information.reason;
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
