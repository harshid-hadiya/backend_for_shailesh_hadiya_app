const mongoose = require("mongoose");

const buyerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true },
    address: { type: String, required: true },
    mono:{type:Number,required:true},
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
    ],

    quantity: {
      type: [Number],
      required: true,
      validate: {
        validator: function (v) {
          return v.every((q) => q > 0);
        },
        message: "Quantity must be greater than 0",
      },
    },

    date: { type: String, required: true },

    timeslots: {
      type: String,
      enum: [
        "9:00 AM","10:00 AM","11:00 AM","12:00 PM",
        "1:00 PM","2:00 PM","3:00 PM","4:00 PM",
        "5:00 PM","6:00 PM",
      ],
      required: true,
    },

    id_of_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "DECLINED", "DELAYED","COMPLETED"],
      default: "PENDING",
    },
    actual_completion_cost:{type:Number,default:0},
    completion_description:{type:String,default:""}
  },
  { timestamps: true }
);

module.exports = mongoose.model("Buyer", buyerSchema);
