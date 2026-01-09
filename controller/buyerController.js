const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Buyer = require("../model/Buyer");
const Products = require("../model/Products");

// CREATE BOOKING
const buyService = asyncHandler(async (req, res) => {
  const { name, email, address, products, quantity, date, timeslots } = req.body;

  if (
    !name ||
    !email ||
    !address ||
    !Array.isArray(products) ||
    !Array.isArray(quantity) ||
    !date ||
    !timeslots
  ) {
    res.status(400);
    throw new Error("All fields are required");
  }

  if (products.length !== quantity.length) {
    res.status(400);
    throw new Error("Products and quantity length mismatch");
  }

  const buyItem = await Buyer.create({
    name,
    email,
    address,
    products,
    quantity,
    date,
    timeslots,
    id_of_user: req.user?._id || null,
  });

  res.status(201).json({
    message: "Our experts will contact you shortly",
    orderId: buyItem._id,
  });
});


const acceptBuyService = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  const { id } = req.params;

  const service = await Buyer.findById(id).select('-__v -createdAt -updatedAt').populate({path:'products',select:'-__v -createdAt -updatedAt'});;
  if (!service) {
    res.status(404);
    throw new Error("Service not found");
  }

  if (service.status !== "PENDING") {
    res.status(400);
    throw new Error(`Cannot accept service in ${service.status} state`);
  }

  service.status = "ACCEPTED";
  service.id_of_user = req.user._id;
  await service.save();
  
  res.status(200).json(service);
});


const delayedBuyService = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  const { id } = req.params;
  
  const service = await Buyer.findById(id).select('-__v -createdAt -updatedAt').populate({path:'products',select:'-__v -createdAt -updatedAt'});
  if (!service) {
    res.status(404);
    throw new Error("Service not found");
  }

  if (!["ACCEPTED","DELAYED"].includes(service.status)) {
    res.status(400);
    throw new Error("Only accepted services can be delayed");
  }
  service.date = req.body.new_date || service.date;
  service.timeslots = req.body.new_timeslots || service.timeslots;
  service.status = "DELAYED";
  await service.save();

  res.status(200).json(service);
});


const handOverBuyService = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  const { id, id_of } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id_of)) {
    res.status(400);
    throw new Error("Invalid user id to hand over");
  }

  const service = await Buyer.findById(id).select('-__v -createdAt -updatedAt').populate({path:'products',select:'-__v -createdAt -updatedAt'});
  if (!service) {
    res.status(404);
    throw new Error("Service not found");
  }

  
  if (!service.id_of_user?.equals(req.user._id)) {
    res.status(403);
    throw new Error("You are not allowed to hand over this service");
  }

  service.id_of_user = id_of;
  await service.save();

  res.status(200).json(service);
});

const completeBuyService = asyncHandler(async (req, res) => {
    if (!req.user) {
      res.status(401);
      throw new Error("Unauthorized");
    }
  
    const { id } = req.params;
  
    const service = await Buyer.findById(id).select('-__v -createdAt -updatedAt').populate({path:'products',select:'-__v -createdAt -updatedAt'});
    if (!service) {
      res.status(404);
      throw new Error("Service not found");
    }
  

    if (!service.id_of_user?.equals(req.user._id)) {
      res.status(403);
      throw new Error("You are not allowed to complete this service");
    }
  

    if (!["ACCEPTED", "DELAYED"].includes(service.status)) {
      res.status(400);
      throw new Error(
        `Service cannot be completed from ${service.status} state`
      );
    }
  
    service.status = "COMPLETED";
    service.actual_completion_cost=req.body.actual_completion_cost || service.actual_completion_cost;
    service.completion_description=req.body?.completion_description || "";
    await service.save();
  
    res.status(200).json({
      message: "Service marked as completed",
      service,
    });
  });
  

  const declineBuyService = asyncHandler(async (req, res) => {
    if (!req.user) {
      res.status(401);
      throw new Error("Unauthorized");
    }
  
    const { id } = req.params;
  
    const service = await Buyer.findById(id);
    if (!service) {
      res.status(404);
      throw new Error("Service not found");
    }
  
    
    if (service.status === "COMPLETED") {
      res.status(400);
      throw new Error("Completed service cannot be declined");
    }
  

    if (service.status === "DECLINED") {
      res.status(400);
      throw new Error("Service already declined");
    }
  

    if (
      service.status === "ACCEPTED" &&
      !service.id_of_user?.equals(req.user._id)
    ) {
      res.status(403);
      throw new Error("You are not allowed to decline this service");
    }
  
    service.status = "DECLINED";
    await service.save();
  
    res.status(200).json({
      message: "Service has been declined",
      service,
    });
  });

  const getAllYourServices = asyncHandler(async (req, res) => {
    if (!req.user) {
      res.status(401);
      throw new Error("Unauthorized");
    }
  
    const data = await Buyer.find({
      $or: [
        {
          id_of_user: req.user._id,
          status: { $in: ["ACCEPTED", "DELAYED"] }
        },
        {
          status: "PENDING"
        }
      ]
      
    })
    .select('-__v -createdAt -updatedAt')
    .populate({
      path: 'products',
      select: '-__v -createdAt -updatedAt'
    });
    
    res.status(200).json(data);
  });
  const getDateWiseCollections = asyncHandler(async(req, res) => {
    if (!req.user) {
        res.status(401);
        throw new Error("Unauthorized");
    }

    const { date } = req.params;
    if (!date) {
        res.status(400);
        throw new Error("Date is required");
    }

    const data = await Buyer.find({ date, status: "COMPLETED" })
        .select('-__v -createdAt -updatedAt')
        .populate({ path: 'products', select: '-__v -createdAt -updatedAt' });

    const totalCollection = data.reduce((acc, current) => {
        return acc + (current.actual_completion_cost || 0); 
    }, 0);
    

    res.status(200).json({
        success: true,
        totalCollection,
        data
    });
});

  
  
module.exports = {
  buyService,
  acceptBuyService,
  delayedBuyService,
  handOverBuyService,
  completeBuyService,
  declineBuyService,
  getAllYourServices,
  getDateWiseCollections
};
