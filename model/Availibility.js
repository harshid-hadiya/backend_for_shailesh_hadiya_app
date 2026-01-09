const mongoose =require('mongoose')
const nonAvailibility=mongoose.Schema({
   date:{type:String},
   nonavailibility:{type:[String],enum:["9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM"],default:[]}
},{timestamps:true})

const data=mongoose.model("nonA",nonAvailibility)
module.exports=data;