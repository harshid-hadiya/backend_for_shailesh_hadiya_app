const mongoose = require("mongoose");
const Product = require("../model/Products.js");
const asyncHandler = require("express-async-handler");


const createProducts = asyncHandler(async (req, res) => {
  const {
    processTitle = [],
    process = [],
    images = [],
    cost,
    discount = 0,
    needs = [],
    sname,
    about = [],
    requiredTime,
    serviceCategory,
  } = req.body;

  const missing = [];
  if (cost === undefined) missing.push("cost");
  if (!sname) missing.push("sname");
  if (!requiredTime) missing.push("requiredTime");
  if (!serviceCategory) missing.push("serviceCategory");

  if (missing.length) {
    res.status(400);
    throw new Error(`Missing required fields [${missing.join(", ")}]`);
  }


  
  const exists = await Product.findOne({ sname });
  if (exists) {
    res.status(400);
    throw new Error("Service with this name already exists");
  }

  const product = await Product.create({
    processTitle,
    process,
    images,
    cost,
    discount,
    needs,
    sname,
    about,
    requiredTime,
    serviceCategory,
  });

  res.status(201).json(product);
});



const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid product ID");
  }

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const allowedFields = [
    "processTitle",
    "process",
    "images",
    "cost",
    "discount",
    "needs",
    "sname",
    "about",
    "requiredTime",
    "serviceCategory",
  ];

  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if ("cost" in updates && typeof updates.cost !== "number") {
    res.status(400);
    throw new Error("Invalid cost value");
  }

  if ("requiredTime" in updates && !updates.requiredTime) {
    res.status(400);
    throw new Error("requiredTime is required");
  }

  if ("serviceCategory" in updates) {
    const allowed = [
      "Service",
      "Repair & gas Refill",
      "installation/uninstallation",
    ];
    if (!allowed.includes(updates.serviceCategory)) {
      res.status(400);
      throw new Error("Invalid service category");
    }
  }

  if (updates.sname && updates.sname !== product.sname) {
    const exists = await Product.findOne({ sname: updates.sname });
    if (exists) {
      res.status(400);
      throw new Error("Service name already exists");
    }
  }

  Object.assign(product, updates);
  const updatedProduct = await product.save(); // validators run here

  res.status(200).json(updatedProduct);
});


const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid product ID");
  }

  const deleted = await Product.findByIdAndDelete(id);
  if (!deleted) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.status(200).json({ message: "Product deleted successfully" });
});


const getAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.status(200).json(products);
});


const getSingleProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid product ID");
  }

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.status(200).json(product);
});

module.exports = {
  createProducts,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getSingleProduct,
};
