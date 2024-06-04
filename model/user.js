const mongoose = require("mongoose");

const userModel = new mongoose.Schema({
    name:{type:String, default:""},
   phone:{type:Number,default:0},
   userType:{type:String, default:"User"},
   khana:[{type:mongoose.Types.ObjectId, ref:"Khana"}]
},{timestamps:true});

 const User = mongoose.model("User", userModel);
module.exports = User