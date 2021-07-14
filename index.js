const express = require("express");
const app = express();
const mongodb = require("mongodb");
require("dotenv").config();
const URL = process.env.URL;
const DB = process.env.DB;
const bcrypt = require("bcryptjs");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { ObjectId } = require("bson");
app.use(cors());
app.use(express.json());

//Registration
app.post("/register", async (req, res) => {
  try {
    let connection = await mongodb.connect(URL, {
      useUnifiedTopology: true,
    });
    let db = connection.db(DB);
    let salt = await bcrypt.genSalt(10);
    let hash = await bcrypt.hash(req.body.password, salt);
    req.body.password = hash;
    let existingmail = await db
      .collection("customers")
      .findOne({ email: req.body.email });
    console.log(existingmail);
    if (existingmail == null) {
      await db.collection("customers").insertOne({ ...req.body });
      res.json({
        message: "Customer Registered",
      });
      let reguser = await db
        .collection("customers")
        .findOne({ email: req.body.email });
      sendMail(req.body.email, reguser._id);
      await connection.close();
    } else {
      res.json({
        message: "Customer already registered",
      });
    }
  } catch (error) {
    console.log(error);
  }
});

//Login
app.post("/login", async (req, res) => {
  try {
    let connection = await mongodb.connect(URL, {
      useUnifiedTopology: true,
    });
    let db = connection.db(DB);
    let customer = await db
      .collection("customers")
      .findOne({ email: req.body.email });
    if (customer && customer.verified == true) {
      let isPasswordCorrect = await bcrypt.compare(
        req.body.password,
        customer.password
      );
      if (isPasswordCorrect) {
        let token = jwt.sign({ _id: customer._id }, process.env.SECRET);
        res.json({
          message: "Allow",
          token: token,
        });
      } else {
        res.json({
          message: "Email or Password is incorrect",
        });
      }
    } else {
      res.json({
        message: "Email or Password is incorrect",
      });
    }
  } catch (error) {
    console.log(error);
  }
});

//Mail verification
const sendMail = (email, uniqueid) => {
  var Transport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.mail,
      pass: process.env.pwd,
    },
  });
  var sender = "Customer";
  var mailOptions = {
    from: sender,
    to: email,
    subject: "Email Confirmation",
    html: `Press <a href=http://localhost:5000/verify/${uniqueid}> here </a> to verify your Email. Thanks`,
  };
  Transport.sendMail(mailOptions, function (error, response) {
    if (error) {
      console.log(error);
    } else {
      console.log("message sent");
    }
  });
};

//Verification
app.get("/verify/:uid", async (req, res) => {
  const { uid } = req.params;
  try {
    let connection = await mongodb.connect(URL, { useUnifiedTopology: true });
    let db = connection.db(DB);
    let user = await db.collection("customers").find({ _id: ObjectId(uid) });
    await db
      .collection("customers")
      .findOneAndUpdate({ _id: ObjectId(uid) }, { $set: { verified: true } });
    if (user) {
      res.redirect("http://localhost:3000/login");
    }
  } catch (error) {
    console.log(error);
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log("Listening on 5000"));
