const express = require("express")
const router = express.Router()
const User = require("../models/user")
const Editor = require("../models/editor")

router.post("/register", async(req, res) => {
    try{
        await User.create(req.body)
        res.status(200).json({message:"User data saved successfully!", data: req.body})
    }catch(e){
        res.status(400).json({message: "Error Processing data",error: e, data: req.body})
    }
})

router.post("/document/create", async(req, res) => {
    try{
        await Editor.create(req.body)
        res.status(200).json({message:"Document saved successfully!", data: req.body})
    }catch(e){
        res.status(400).json({message: "Error Processing Document",error: e, data: req.body})
    }
})

router.post("/findOne", async(req, res) => {
    try{
        const user = await User.findOne({phone_number: req.body.phone_number}).exec()
        res.status(200).json({message:"User data gotten successfully!", data: req.body})
    }catch(e){
        res.status(400).json({message: "Error Getting user data",error: e, data: req.body})
    }
})

router.get("/findAll", async(req, res) => {
    try{
        const users = await User.find({})
        res.status(200).json({message:"All User data gotten successfully!", data: users})
    }catch(e){
        res.status(400).json({message: "Error Getting user data",error: e, data: req.body})
    }
})

router.get("/document/findAll", async(req, res) => {
    try{
        const documents = await Editor.find({})
        res.status(200).json({message:"All User Documents gotten successfully!", data: documents})
    }catch(e){
        res.status(400).json({message: "Error Getting user documents",error: e, data: req.body})
    }
})

router.post("/update", async(req, res) => {
    try{
        const user = await User.findOne({phone_number: req.body.phone_number})
        user.full_name = req.body.full_name
        user.phone_number = req.body.new_phone_number

        await user.save()
        res.status(200).json({message:"User data updated successfully!", data: req.body})
    }catch(e){
        res.status(400).json({message: "Error Updating User Details data",error: e, data: req.body})
    }
})

router.post("/delete", async(req, res) => {
    try{
        const user = await User.findOne({phone_number: req.body.phone_number})
        await user.remove()
        res.status(200).json({message:"User data deleted successfully!", data: req.body})
    }catch(e){
        res.status(400).json({message: "Error Deleting User",error: e, data: req.body})
    }
})

module.exports = router
