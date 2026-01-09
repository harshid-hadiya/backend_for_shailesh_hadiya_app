const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    processTitle: { type: [String], default: [] },
    process: { type: [String], default: [] },
    images: { type: [String], default: [] },
    cost: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    needs: {
      type: [String],
      enum: ["Plug Point", "Ladder/Stool", "2 Buckets"],
      default: [],
    },
    sname: { type: String, required: true, unique: true, trim: true },
    about: { type: [String], default: [] },
    requiredTime: { type: String, required: true },
    serviceCategory:{type: String,enum:["Service","Repair & gas Refill","installation/uninstallation"]},
    pulic_id_of_image: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
