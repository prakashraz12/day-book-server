const mongoose = require("mongoose");

const extraItemModel = new mongoose.Schema({
    name:{type:String, default:"", unique:true},
    price:{type:Number, required:true},
})
 const Extra = mongoose.model("Extra", extraItemModel);
module.exports = Extra;
