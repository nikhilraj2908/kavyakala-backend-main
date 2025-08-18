const mongoose=require("mongoose")

const adminSchema =new mongoose.Schema({
    email:{type:"string",required:true,unique:true},
    password:{type:"string",required:true},
})
module.exports=mongoose.model('Admin',adminSchema);