const mongoose = require("mongoose")

const intrestratesSchema = mongoose.Schema({
    tenuretype: String,
    tenure: Number,
    rateofintrest: Number
});

const interestSchema = mongoose.Schema({
    intrestrates: [intrestratesSchema]
},{timestamps:true})

const Intrestrate = mongoose.model('Intrestrate',interestSchema)
module.exports = Intrestrate
