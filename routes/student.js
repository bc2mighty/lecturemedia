const express = require("express")
const router = express.Router()
const bcrypt = require('bcrypt')
const Joi = require('@hapi/joi');
const Student = require("../models/student")
const Chat = require("../models/chat")
const Course = require("../models/course")
const Multimedia = require("../models/multimedia")
const path = require('path')

const redirectLogin = (req, res, next) => {
    if(!req.session.studentLoggedIn){
        res.redirect("/student/login")
    }else{
        next()
    }
}

const redirectHome = (req, res, next) => {
    if(req.session.studentLoggedIn){
        res.redirect("/student/dashboard")
    }else{
        next()
    }
}

router.get("/login", redirectHome, async(req, res) => {
    res.render('student/login',{
        matric_no: '', password: '', error_message: ''
    })
})

router.post("/login", redirectHome, async(req, res, next) => {
    var error_message = ''
    const schema = Joi.object({
        matric_no: Joi.string().regex(/^[a-zA-Z0-9/]*$/).min(8).max(15).required(),
        password: Joi.string().pattern(/^[a-zA-Z0-9]{8,32}$/)
    })

    const {error, value} = schema.validate(req.body)

    if(error){
        switch(error.details[0].context.key){
            case 'matric_no':
                // req.flash('failure', "Matric Number Error")
                error_message = 'Matric Number error'
                res.render("student/login", {
                    matric_no: req.body.matric_no, password: req.body.password, error_message: error_message
                })
                break
            case 'password':
                // req.flash('failure', "Password Error")
                error_message = 'Password error'
                res.render("student/login", {
                    matric_no: req.body.matric_no, password: req.body.password, error_message: error_message
                })
                break
            default:
                break;
        }
    }

    const student = await Student.findOne({matric_no: req.body.matric_no}).exec()

    if(student == null || student.length < 1){
        console.log('It\'s null')
        error_message = "Incorrect Matric Number Provided"
        res.render("student/login", {
            matric_no: req.body.matric_no, password: req.body.password, error_message: error_message
        })
    }else{
        bcrypt.compare(req.body.password, student.password, (err, state) => {
            if(state == false){
                res.render("student/login", {
                    matric_no: req.body.matric_no, password: req.body.password, error_message: 'Password is Incorrect'
                })
            }else if(state == true){
                // res.send("Details are very correct provided")
                req.session.studentLoggedIn = true
                req.session.studentId = student._id
                req.flash('success', "Student Logged In Successfully")
                res.redirect('/student/dashboard')
            }
        })
    }
})

router.get("/dashboard", redirectLogin, async(req, res) => {
    try{
        const student = await Student.findOne({_id:req.session.studentId})
        const courses = await Course.find({level: student.level}).sort({createdAt: 'desc'})
        res.render('student/dashboard', {student: student})
    }catch(e){
        console.log(e)
        res.end("This is it.... Errrrrrrrrrr")
    }
})

//Courses routes start here

router.get("/courses", redirectLogin, async(req, res) => {
    try{
        const student = await Student.findOne({_id:req.session.studentId})
        const courses = await Course.find({level: student.level}).sort({createdAt: 'desc'})
        res.render("student/courses", {courses: courses, student: student})
    }catch(e){
        console.log(e)
        res.end("This is it.... Errrrrrrrrrr")
    }
})

router.get("/course/:courseId/multimedias", redirectLogin, async(req, res) => {
    const courseId = req.params.courseId
    try{
        const student = await Student.findOne({_id:req.session.studentId})
        const course = await Course.findOne({_id: courseId}).sort({createdAt: 'desc'}).populate('multimedias')
        // console.log(course)
        res.render("student/course_multimedias", {multimedias: course.multimedias, course: course, student: student})
    }catch(e){
        console.log(e)
        res.end("This is it.... Errrrrrrrrrr")
    }
})

router.get("/multimedia", redirectLogin, async(req, res) => {
    try{
        const student = await Student.findOne({_id:req.session.studentId})
        const multimedias = await Multimedia.find({level: student.level}).sort({createdAt: 'desc'})
        // console.log(multimedias)
        res.render("student/multimedias", {multimedias: multimedias, student: student})
    }catch(e){
        console.log(e)
        res.end("This is it.... Errrrrrrrrrr")
    }
})

router.get("/multimedia/:multimediaId", redirectLogin, async(req, res) => {
    const multimediaId = req.params.multimediaId
    // console.log(multimediaId)
    try{
        const student = await Student.findOne({_id:req.session.studentId})
        const multimedia = await Multimedia.findOne({_id: multimediaId}).sort({createdAt: 'desc'}).populate('course lecturers')
        // console.log(multimedia)
        res.render("student/multimedia", {multimedia: multimedia, studentId: req.session.studentId, multimediaId: multimediaId, student: student})
    }catch(e){
        console.log(e)
        res.end("This is it.... Errrrrrrrrrr")
    }
})

router.post("/multimedia/:multimediaId", redirectLogin, async(req, res) => {
    res.send("Heyo!")
    var error_message = ''
    const schema = Joi.object({
        message: Joi.string().min(8).max(15).required()
    })

    const {error, value} = schema.validate(req.body)

    if(error){
        switch(error.details[0].context.key){
            case 'message':
                req.flash('failure', '')
                return res.redirect(`/student/multimedia/${req.params.multimediaId}`)
                break
            default:
                break;
        }
    }

    try{
        req.body.studentId = req.session.studentId
        req.body.multimediaId = req.params.multimediaId
        const chat = Chat.create(req.body)
        req.flash("success","Comment Saved Successfully!")
        res.redirect(`/student/multimedia/${req.params.multimediaId}`)
    }catch(e){
        if(e.name === 'MongoError' && e.code === 11000){
            message = "Email Or Phone or Matric Number exists already"
        }else{
            message = "Some Other Error(s) are there bro!"
        }
        req.flash("failure",message)
        res.redirect(`/student/multimedia/${req.params.multimediaId}`)
    }
})

router.get("/logout", redirectLogin, async(req, res) => {
    req.session.destroy(err => {
        if(err){
            return res.redirect("/student/dashboard")
        }
        res.clearCookie("sid")
        return res.redirect("/student/login")
    })
})

module.exports = router
