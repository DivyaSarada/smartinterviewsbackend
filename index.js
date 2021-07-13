const express = require("express");
const app = express();
const mongodb = require("mongodb");
require('dotenv').config()
const URL= process.env.URL
const DB = process.env.DB
const bcrypt = require("bcryptjs")
const cors = require("cors");
const jwt = require("jsonwebtoken");
app.use(cors())
app.use(express.json())

//Registration

app.post('/register',async(req,res)=>{
    try {
		let connection = await mongodb.connect(URL, {
			useUnifiedTopology: true,
		});
		let db = connection.db(DB);
		let salt = await bcrypt.genSalt(10);
		let hash = await bcrypt.hash(req.body.password, salt);
		req.body.password = hash;
        let existingmail=await db.collection("customers").findOne({email:req.body.email})
        console.log(existingmail); 
        if(existingmail==null){   
		await db.collection("customers").insertOne(req.body);
		res.json({
			message: "Customer Registered",
		});
    
        await connection.close();
        
    }
    else{
        res.json({
            message:"Customer already registered",
        })
      
    }
   } catch (error) {
		console.log(error);
	}
})
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
            if (customer) {
                let isPasswordCorrect = await bcrypt.compare(
                    req.body.password,
                    customer.password
                );
                if (isPasswordCorrect) {
                    let token = jwt.sign(
                        { _id: customer._id},
                        process.env.SECRET
                    );
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

    

const port=process.env.PORT||5000
app.listen(port,()=>console.log("Listening on 5000"));