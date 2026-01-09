const router=require('express').Router();
const { buyService } = require("../controller/buyerController");
const { getAllProducts, getSingleProduct } = require('../controller/productController');

router.route("/buyService").post(buyService);
router.route("/getAllProducts").get(getAllProducts)
router.route("/getSingleProduct/:id").get(getSingleProduct)
router.route("/getNonAvailibility/:date").get(async(req,res)=>{
    const {date}=req.params;
    if(!date){
        res.status(400);
        throw new Error("Date is required");
    }
    const nonA=require('../model/Availibility.js')
    const exists=await nonA.findOne({date}).select("nonavailibility -_id");
    if(exists){
        res.status(200).json(exists.nonavailibility);
    }else{
        res.status(200);
        res.json([]);
    }
});
module.exports=router;
