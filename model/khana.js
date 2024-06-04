const mongoose = require("mongoose");

const khanaModel = new mongoose.Schema({
    name: { type: String, default: "Khana" },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
    extraItems: [{
        type: mongoose.Types.ObjectId,
        ref: "Extra"
    }],
    isPaid: {
        type: Boolean,
        default: false
    },
    shift: {
        type: String,
        default: ""
    },
    otherItems: [
        {
            name: {
                type: String,
                required: true

            },
            amount: {
                type: Number,
                required: true
            }
        }
    ],
    consumer:{
        type:mongoose.Types.ObjectId,
        ref:"User"
    }
}, { timestamps: true });

const Khana = mongoose.model("Khana", khanaModel)
module.exports = Khana;
