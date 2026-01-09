const router=require('express').Router();
const expressAsyncHandler = require('express-async-handler');
const { 
    acceptBuyService,
    delayedBuyService,
    handOverBuyService,
    completeBuyService,
    declineBuyService,
    getAllYourServices, 
    getDateWiseCollections,
    tentenCollections} = require("../controller/buyerController");
const { getAllProducts, getSingleProduct,createProducts,
    updateProduct,
    deleteProduct, } = require('../controller/productController');
const { createUser, LoginHandler,updateUser } = require('../controller/userController.js');
const  middlevalidate = require('../middleware/validate.js');
const multer = require('multer');
router.route("/register").post(createUser);
router.route("/login").post(LoginHandler);
router.route("/update").post(middlevalidate,updateUser);
router.route("/acceptBuyService/:id").get(middlevalidate,acceptBuyService);
router.route("/delayedBuyService/:id").post(middlevalidate,delayedBuyService)
router.route("/handOverBuyService").post(middlevalidate,handOverBuyService)
router.route("/completeBuyService/:id").post(middlevalidate,completeBuyService)
router.route("/declineBuyService/:id").post(middlevalidate,declineBuyService)
router.route("/getAllYourServices").get(middlevalidate,getAllYourServices)
router.route("/getDateWiseCollections/:date").get(middlevalidate,getDateWiseCollections);


router.route("/getAllexpersts").get(middlevalidate,expressAsyncHandler(async(req,res)=>{
    const User=require('../model/User.js')
    const experts=await User.find().select("-password -__v -createdAt -updatedAt");
    res.status(200).json(experts);
}));

router.route("/getAllProducts").get(middlevalidate,getAllProducts)
router.route("/getSingleProduct/:id").get(middlevalidate,getSingleProduct)
router.route("/creteProducts").post(middlevalidate,createProducts)
router.route("/updateProduct/:id").put(middlevalidate,updateProduct)
router.route("/deleteProduct/:id").delete(middlevalidate,deleteProduct)
router.route("/getOffsets").post(middlevalidate,tentenCollections)
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

router.route("/removeNonAvailibility").post(expressAsyncHandler(async(req,res)=>{
    const {date,nonavailibility}=req.body;
    if(!date){
        res.status(400);
        throw new Error("Date is required");
    }
    const nonA=require('../model/Availibility.js')
    const exists=await nonA.findOne({date});
    if(exists){
        exists.nonavailibility=exists.nonavailibility.filter(time=>!nonavailibility.includes(time));
        const updated=await exists.save();
        res.status(200).json(updated);
    }else{
        res.status(404);
        throw new Error("No non availibility found for this date");
    }
}));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

router.route("/addImage").post(middlevalidate,upload.single('profilepic'),expressAsyncHandler(async(req,res)=>{
    if(!req.file){
        res.status(400);
        throw new Error("Image is compulsory required okay");
    }
    const buffer=req.file.buffer.toString('base64');
    const uri=`data:${req.file.mimetype};base64,${buffer}`
    const result=await cloudinary.uploader.upload(uri,{
        folder:"profile_pics_of_experts",
        resource_type:"image"
    })

    const newImage={
        public_id:result.public_id,
        url:result.secure_url
    };
    const user=await require('../model/User.js').findById(req.user._id).select("-password");
    if(user.profilePic != "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"){
        const publicid=JSON.parse(user.profilePic).public_id;
        await cloudinary.uploader.destroy(publicid);
    }
    user.profilePic=JSON.stringify(newImage);
    await user.save();
    res.status(201).json(user);
}));

router.route("/addProductImage/:id").post(middlevalidate,upload.array('productimages',10),expressAsyncHandler(async(req,res)=>{
    if(!req.files || req.files.length===0){
        res.status(400);
        throw new Error("Atleast one image is compulsory required okay");
    }
    const uploadedImages=[];
    for(const file of req.files){
        const buffer=file.buffer.toString('base64');
        const uri=`data:${file.mimetype};base64,${buffer}`
        const result=await cloudinary.uploader.upload(uri,{
            folder:"product_images",
            resource_type:"image"
        });
        uploadedImages.push({
            public_id:result.public_id,
            url:result.secure_url
        });
    }
    const Product=require('../model/Products.js')
    const product=await Product.findById(req.params.id);
    if(!product){
        for(const img of uploadedImages){
            await cloudinary.uploader.destroy(img.public_id);
        }
        res.status(404);
        throw new Error("Product not found");
    }
    product.images=uploadedImages.map(img=>img.url);
    product.pulic_id_of_image=uploadedImages.map(img=>img.public_id);
    await product.save();
    res.status(201).json(product);
}));

router.route("/updateProductImage/:id").post(middlevalidate,upload.array('productimages',10),expressAsyncHandler(async (req,res) => {
    if(!req.files || req.files.length===0){
        res.status(400);
        throw new Error("Atleast one image is compulsory required okay");
    }
    const uploadedImages=[];
    for(const file of req.files){
        const buffer=file.buffer.toString('base64');
        const uri=`data:${file.mimetype};base64,${buffer}`
        const result=await cloudinary.uploader.upload(uri,{
            folder:"product_images",
            resource_type:"image"
        });
        uploadedImages.push({
            public_id:result.public_id,
            url:result.secure_url
        });
    }
    const {data}=req.body;
    const Product=require('../model/Products.js')
    const product=await Product.findById(req.params.id);
    await Promise.all(data.map((i,index)=>{
        product.public_id_of_image[i]=uploadedImages[index].public_id;
        product.images[i]=uploadedImages[index].url;
        return cloudinary.uploader.destroy(product.pulic_id_of_image[i]);

    }))
    await product.save();
    res.status(200).json(product);
}))
module.exports=router;
