const mongoose = require('mongoose')
const userSchema = mongoose.Schema({
    username: String,
    password: String,
    mobile:Number,
    role: String
},{timestamps: true})

const User = mongoose.model('User',userSchema)
module.exports = User
