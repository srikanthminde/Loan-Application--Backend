const mongoose = require('mongoose');

const interestSchema = mongoose.Schema({
    tenuretype: String,
    tenure: Number,
    rateofintrest: Number
});
  
const statusSchema = mongoose.Schema({
    code: String,
    timestamp: Number
});

const emiSchema = mongoose.Schema({
   emiAmount: Number,
   emiDate: String,
   emiStatus: String,
})

const loanSchema = mongoose.Schema({
  typeofloan: String,
  loanitem: String,
  productcost: Number,
  intrest: interestSchema, 
  downpayment: Number,
  status: [statusSchema], 
  customerMobile: Number,
  customerName:String,
  emis:[emiSchema]
},{timestamps: true});

const Loan = mongoose.model('Loan',loanSchema)
module.exports = Loan

