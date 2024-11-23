const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const bodyparser = require("body-parser")
const jwt = require('jsonwebtoken')
const User = require("./models/user.model")
const Loan = require("./models/loan.model")
const Intrestrate = require("./models/intrestrate.model")

const app = express()

app.use(cors())
app.use(bodyparser.urlencoded({extended:false}))
app.use(bodyparser.json())


mongoose.connect("mongodb+srv://sai:sai987654321@atlascluster.ym1yuin.mongodb.net/lms?retryWrites=true&w=majority&appName=AtlasCluster")


var adminManagerAuthenticate = async (req,res,next)=>{
    try {
       var token = req.headers.authorization;
       if(!token){
         return res.json({msg:"token missing"})
       }
       var decoded =  jwt.verify(token,'secretkey');
       var user = await User.findById(decoded._doc._id);
       if(!user){
         return res.json({msg:"user not found"})
       }
       if(user.role==='admin' || user.role==='manager'){
          next()
       }
       else{
         return res.json({msg:"you dont have access"})
       }
       
    }
    catch (error) {
        res.json({ message: 'Invalid token' });
    }
}


var adminauthenticate = async(req,res,next)=>{
    try {
        var token = req.headers.authorization;
        if(!token){
          return res.json({msg:"token missing"})
        }
        var decoded =  jwt.verify(token,'secretkey');
        var user = await User.findById(decoded._doc._id);
        if(!user){
         return res.json({msg:"user not found"})
        }
        if(user.role==='admin'){
           next()
        }
         else{
            return res.json({msg:"you dont have access admin required"})
         }
     }
     catch (error) {
         res.json({ message: 'Invalid token' });
     }
}


var userauthenticate = async(req,res,next)=>{
    try {
        var token = req.headers.authorization;
        if(!token){
          return res.json({msg:"token missing"})
        }
        var decoded =  jwt.verify(token,'secretkey');
        var user = await User.findById(decoded._doc._id);
        if(!user){
         return res.json({msg:"user not found"})
        }
        if(user.role==='user'){
            req.mobile = user.mobile
            next()
        }
         else{
            return res.json({msg:"you dont have access"})
         }
     }
     catch (error) {
         res.json({ message: 'Invalid token' });
     }
}


app.post("/signup",async(req,res)=>{
    try {
       var newUser = new User({...req.body,role:'user'})
       var user = await newUser.save()
       console.log("user",user)
       res.json({msg:"signupsuccess"})
    } 
    catch (error) {
       res.json({msg:"signup failed"})
    }
})


app.post("/login",async(req,res)=>{
   try {
     var user = await User.findOne({username:req.body.username,password:req.body.password})
       var token = jwt.sign({...user}, 'secretkey')
       res.json({msg:"loginsuccess",token,role:user.role})
   } 
   catch (error) {
       res.json({msg:"login failed"})
   }
})




app.get("/",adminManagerAuthenticate,async(req,res)=>{
    try {
        var page = parseInt(req.query.page) || 1;
        var limit = parseInt(req.query.limit) || 10;
        var skip = (page - 1) * limit;
        var loans = await Loan.aggregate([
            { $sort: { updatedAt: -1 } },   
            { $skip: skip },                
            { $limit: limit },             
            { 
                $project: {                 
                    _id: 1,
                    customerName: 1,
                    customerMobile: 1,
                    loanitem: 1,
                    productcost: 1,
                    status:1
                }
            }
        ]);
        if(loans.length>0){
            res.send(loans);
        }
        else{
            res.json({ msg: "No loans found" });
        }
        
    } catch (error) {
        res.json({ msg: "Error in finding loans" });
    }
})




app.get("/loandetails/:id",adminManagerAuthenticate,async(req,res)=>{
    try {
       var loandetails = await Loan.findOne({_id:req.params.id})
       var {_id,typeofloan,loanitem,productcost,intrest,downpayment,customerMobile,customerName} = loandetails
       var obj = {
        _id,
        typeofloan,
        loanitem,
        productcost,
        intrest,
        downpayment,
        customerMobile,
        customerName
       }
       res.send(obj)
    } catch (error) {
       res.json({msg:"err in finding loan details"})
    }
})


app.get("/userloandetails",userauthenticate,async(req,res)=>{
    try {
        const loandetails = await Loan.findOne({customerMobile:req.mobile})
        if(loandetails){
            var {_id,emis} = loandetails
            res.send({_id,emis})
        }
        else{
            res.send({msg:"no loan details found"})
        }
    } catch (error) {
        res.json({msg:"err in finding user loan details"})
    }
})


app.put('/payemi/:loanId/:emiId',userauthenticate,async(req,res)=>{
    const updatedLoan = await Loan.findOneAndUpdate(
        { _id: req.params.loanId, "emis._id": req.params.emiId },
        { $set: { "emis.$.emiStatus": "paid" } },
        { new: true }
      )
      if(updatedLoan){
        res.json({msg:"emi paid"})
      }
      else{
        res.json({msg:"err in paying emi"})
      }
})



app.post("/addloan",adminManagerAuthenticate,async(req,res)=>{
    try {
        var newLoan = new Loan(req.body)
        newLoan.status.push({code:"applied",timestamp:Date.now()})
        const newLoanuser = await newLoan.save()
        res.json({msg:"loan added"})
    } catch (error) {
        res.json({msg:"err in adding loan"})
    }
})



app.put("/approveloan/:id",adminauthenticate,async(req,res)=>{
    try {
        var updstatus = {code:"approved",timestamp: Date.now()}
        var updloan = await Loan.findOneAndUpdate({_id:req.params.id},{$push:{status:updstatus}})
        res.json({msg:"loan approved"})
    } 
    catch (error) {
        res.json({msg:"error in approving loan"})
    }
})



app.put("/downpaymentReceived/:id",adminManagerAuthenticate,async(req,res)=>{
    try {
        var updstatus = {code:"downpayment Received",timestamp:Date.now()}
        var updloan = await Loan.findOneAndUpdate({_id:req.params.id},{$push:{status:updstatus}})
        res.json({msg:"downpayment Received"})
    } 
    catch (error) {
        res.json({msg:"error in updating downpayment details"})
    }
})


app.put("/disburseloan/:id",adminauthenticate,async(req,res)=>{
    try {
        var updstatus = {code:"disbursed",timestamp:Date.now()}
        var updloan = await Loan.findOneAndUpdate({_id:req.params.id},{$push:{status:updstatus}},{ new: true })
        console.log("updloan",updloan)
        if (!updloan) {
            return res.json({ msg: "Loan not found" });
        }
        var netLoanAmount = +(updloan.productcost)+((updloan.productcost)*(updloan.intrest.rateofintrest))/100;
        var emiAmount =  Math.ceil((netLoanAmount-(updloan.downpayment))/updloan.intrest.tenure)
        var emiSchedule = [];
        for (let i = 1; i <= updloan.intrest.tenure; i++) {
            emiSchedule.push({
                emiAmount,
                emiDate: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000),
                emiStatus: "not paid"
            });
        }
        await Loan.findOneAndUpdate(
            { _id: req.params.id },
            { $push: { emis: { $each: emiSchedule } } }
        );
        res.json({ msg: "loan disbursed" });
    } 
    catch (error) {
        res.json({msg:"error in disbursing loan"})
    }
})



app.get("/intrestrates",adminManagerAuthenticate,async(req,res)=>{
    try {
        var intrestrates = await Intrestrate.find();
        console.log("iiii",intrestrates)
        if(intrestrates.length>0){
            var data = {
                id: intrestrates[0]._id,
                intrestrates: intrestrates[0].intrestrates
            }
            res.send(data)
        }
        else{
            res.json({msg:"no intrestrates found"})
        }
    } catch (error) {
        res.json({msg:"error in finding intrestrates"})
    }
})


app.post("/addintrestrates",adminauthenticate,async(req,res)=>{
    try {
        var intrestratesdata = new Intrestrate(req.body)
        intrestratesdata.intrestrates.push(req.body)
        console.log(intrestratesdata)
        await intrestratesdata.save() 
        res.json({msg:"intrestrates added"})
    } catch (error) {
        res.json({msg:"err in adding intrestrates"})
    }
})



app.put("/updateintrestrate/:id",adminauthenticate,async(req,res)=>{
    try {
        var intrestrate = req.body
        await Intrestrate.findOneAndUpdate({_id:req.params.id},{$push:{intrestrates:intrestrate}})
        res.json({msg:"intrestrate updated"})
    } catch (error) {
        res.json({msg:" error in updating intrestrate"})
    }
})


app.get('/addmanager',adminauthenticate,async(req,res)=>{
    try {
        const users = await User.find()
        const data = users.map((user)=>{
            var obj = {id:user._id,username:user.username,role:user.role}
            return obj
        })
        res.send(data)
    } catch (error) {
        res.json({ msg: "Error in finding data" });
    } 
})


app.put("/approvemanager/:id",adminauthenticate,async(req,res)=>{
    try {
        const approvemanager = await User.findOneAndUpdate({_id:req.params.id},{ $set: { role: "manager" } },{ new: true })
         res.json({msg:"approved"})
    } catch (error) {
        res.json({ msg: "Error in approving manager" });
    }
})


app.put("/removemanager/:id",adminauthenticate,async(req,res)=>{
    try {
        const removemanager = await User.findOneAndUpdate({_id:req.params.id},{ $set: { role: "user" } },{ new: true })
         res.json({msg:"manager removed"})
    } catch (error) {
        res.json({ msg: "Error in removing manager" });
    }
})



app.listen(7777,()=>{
    console.log('server is running on port 7777')
})