const router=require('express').Router();
const expressAsyncHandler = require('express-async-handler');
const { 
    acceptBuyService,
    delayedBuyService,
    handOverBuyService,
    completeBuyService,
    declineBuyService,
    getAllYourServices } = require("../controller/buyerController");
const { getAllProducts, getSingleProduct,createProducts,
    updateProduct,
    deleteProduct, } = require('../controller/productController');
const { createUser, LoginHandler,updateUser } = require('../controller/userController.js');
const  middlevalidate = require('../middleware/validate.js');
router.route("/register").post(createUser);
router.route("/login").post(LoginHandler);
router.route("/update").post(middlevalidate,updateUser);
router.route("/acceptBuyService/:id").get(middlevalidate,acceptBuyService);
router.route("/delayedBuyService/:id").get(middlevalidate,delayedBuyService)
router.route("/handOverBuyService").post(middlevalidate,handOverBuyService)
router.route("/completeBuyService/:id").post(middlevalidate,completeBuyService)
router.route("/declineBuyService/:id").get(middlevalidate,declineBuyService)
router.route("/getAllYourServices").get(middlevalidate,getAllYourServices)

router.route("/getAllProducts").get(middlevalidate,getAllProducts)
router.route("/getSingleProduct/:id").get(middlevalidate,getSingleProduct)
router.route("/creteProducts").post(middlevalidate,createProducts)
router.route("/updateProduct/:id").put(middlevalidate,updateProduct)
router.route("/deleteProduct/:id").delete(middlevalidate,deleteProduct)
router.route("/setnonAvailibility").post(expressAsyncHandler(async(req,res)=>{
    const {date,nonavailibility}=req.body;
    if(!date){
        res.status(400);
        throw new Error("Date is required");
    }
    const nonA=require('../model/Availibility.js')
    const exists=await nonA.findOne({date});
    if(exists){
        exists.nonavailibility=exists.nonavailibility.push(...nonavailibility);
        const updated=await exists.save();
        res.status(200).json(updated);
    }else{
        const newNonA=await nonA.create({
            date,
            nonavailibility
        });
        res.status(201).json(newNonA);
    }
}));
module.exports=router;
