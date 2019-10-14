const express = require("express")
const router = express.Router()
const bcrypt = require('bcrypt')
const Joi = require('@hapi/joi');
const Student = require("../models/student")
const Lecturer = require("../models/lecturer")
const Course = require("../models/course")
const Multimedia = require("../models/multimedia")
const Chat = require("../models/chat")
const path = require('path')
const saltRounds = 10
const uploadPath = Multimedia.multimediaBasePath
const mimeTypes = ['video/ogg','video/mp4','video/webm','audio/wav','audio/mp4','audio/mp3','audio/ogg','audio/mpeg']
const fs = require("fs")

const multer = require("multer")

// const upload = multer({
//     dest: uploadPath,
//     fileFilter: (req, file, cb) => {
//         cb(null, mimeTypes.includes(file.mimetype))
//     }
// })

var storage = multer.diskStorage({
  destination: uploadPath,
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)) //Appending extension
  }
})

var upload = multer({ storage: storage });

// const storage = multer.diskStorage({
//   destination(req, file, cb){
//     cb(null, path.join(__dirname, '/uploads/'))
//   },
//   filename(req, file, cb){
//     cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname.replace(/ /g,''))
//   }
// })
//
// const fileFilter = (req, file, cb) => {
//   if(file.mimeType === "image/png" || file.mimeType === "image/jpeg" || file.mimeType === "image/jpg"){
//     cb(null, false)
//   }else{
//     cb(null, true)
//   }
// }
// const upload = multer(
//   {
//     storage: storage,
//     limits:{
//       fileSize: 1024 * 1024 * 70
//     },
//     fileFilter: fileFilter
//   }
// )

const redirectLogin = (req, res, next) => {
    if(!req.session.adminId){
        res.redirect("/admin/login")
    }else{
        next()
    }
}

const redirectHome = (req, res, next) => {
    if(req.session.adminId){
        res.redirect("/admin/dashboard")
    }else{
        next()
    }
}

router.get("/login", redirectHome, async(req, res) => {
    res.render('admin/login', {
        request: {username: '', password: ''}
    })
})

router.post("/login", redirectHome, async(req, res) => {
    // res.send("Here")
    const schema = Joi.object({
        username: Joi.string().alphanum().min(8).max(15).required(),
        password: Joi.string().pattern(/^[a-zA-Z0-9]{8,32}$/)
    })
    const {error, value} = schema.validate(req.body)

    if(error){
        switch(error.details[0].context.key){
            case 'username':
                req.flash('failure', "Username Error")
                res.render("admin/login", {
                    request: req.body
                })
                break
            case 'password':
                req.flash('failure', "Password Error")
                res.render("admin/login", {
                    request: req.body
                })
                break
            default:
                break;
        }
    }

    if(req.body.username == 'admin123' && req.body.password == 'japa12345'){
        req.session.adminId = true
        req.flash('success', "Admin Logged In Successfully")
        res.redirect("/admin/dashboard")
    }else{
        // console.log("Here")
        req.flash('failure', "Incorrect Details Provided")
        res.render("/admin/login", {
            request: req.body
        })
    }
})

router.get("/logout", redirectLogin, async(req, res) => {
    req.session.destroy(err => {
        if(err){
            return res.redirect("/admin/dashboard")
        }
        res.clearCookie('sid')
        res.redirect("/admin/login")
    })
})

router.get("/dashboard", redirectLogin, async(req, res) => {
    try{
        const course = await Course.find({})

        const chats = await Chat.find({})

        const multimedia = await Multimedia.find({})
        
        res.render("admin/dashboard",{course: course, chat: chats, multimedia: multimedia})
    }catch(e){
        console.log(e)
        res.end("This is it.... Errrrrrrrrrr")
    }
})

//Student routes starts here

router.get("/students", redirectLogin, async(req, res) => {
    try{
        const students = await Student.find({}).sort({createdAt: 'desc'})
        res.render("admin/students", {students: students})
    }catch(e){
        console.log(e)
        res.end("This is it.... Errrrrrrrrrr")
    }
})

router.get("/student/create", redirectLogin, async(req, res) => {
    res.render("admin/create_student", {request: {}, errors: {}, err_message: ""})
})

router.post("/student/create", redirectLogin, async(req, res) => {
    const schema = Joi.object({
        full_name: Joi.string().min(3).max(100).required(),
        email_address: Joi.string().email(),
        phone_number: Joi.string().pattern(/^[0-9]{11,32}$/),
        matric_no: Joi.string().required(),
        gender: Joi.string().required(),
        level: Joi.string().required(),
        department: Joi.string().required(),
        password: Joi.string().pattern(/^[a-zA-Z0-9]{5,32}$/)
    })
    const {error, value} = schema.validate(req.body)
    const errors = {}
    let message
    if(error){
        switch(error.details[0].context.key){
            case 'full_name':
                errors.full_name = "Please provide full name with characters between 3 and 15"
                break
            case 'email_address':
                errors.password = "Please provide correct email address"
                break
            case 'phone_number':
                errors.phone_number = "Please provide correct phone number"
                break
            case 'matric_no':
                errors.matric_no = "Please provide correct matric number"
                break
            case 'gender':
                errors.gender = "Please provide gender"
                break
            case 'password':
                errors.password = "Please provide Password between 5 and 32 characters"
                break
            case 'level':
                errors.level = "Please provide level"
                break
            case 'department':
                errors.department = "Please provide Department"
                break
            default:
                break
        }
    }
    if(Object.keys(errors).length > 0){
        res.render("admin/create_student", {request: req.body, errors: errors, err_message: "Got some errors there"})
    }else{
        var salt = bcrypt.genSaltSync(saltRounds)
        var hash = bcrypt.hashSync(req.body.password, salt)
        req.body.password = hash
        try{
            const student = await Student.create(req.body)
            req.flash('success', "Student created Successfully")
            res.redirect("/admin/students")
        }catch(e){
            if(e.name === 'MongoError' && e.code === 11000){
                message = "Email Or Phone or Matric Number exists already"
            }else{
                message = "Some Other Error(s) are there bro!"
            }
            res.render("admin/create_student", {request: req.body, errors: {}, err_message: message})
        }
    }
})

router.get("/student/edit/:studentId", redirectLogin, async(req, res) => {
    const studentId = req.params.studentId
    try{
        const student = await Student.findOne({_id: studentId}).exec()
        res.render("admin/edit_student", {request: {}, student: student, errors: {}, err_message: ""})
    }catch(e){
        console.log(e)
        res.end("Errors are here")
    }
})

router.post("/student/edit/:studentId", redirectLogin, async(req, res) => {
    const studentId = req.params.studentId
    let student
    student = await Student.findOne({_id: studentId})
    const schema = Joi.object({
        full_name: Joi.string().min(3).max(100).required(),
        email_address: Joi.string().email(),
        phone_number: Joi.string().pattern(/^[0-9]{11,32}$/),
        matric_no: Joi.string().required(),
        gender: Joi.string().required(),
        level: Joi.string().required(),
        department: Joi.string().required(),
        password: Joi.string().pattern(/^[a-zA-Z0-9]{5,32}$/)
    })
    const {error, value} = schema.validate(req.body)
    const errors = {}
    let message
    if(error){
        switch(error.details[0].context.key){
            case 'full_name':
                errors.full_name = "Please provide full name with characters between 3 and 15"
                break
            case 'email_address':
                errors.password = "Please provide correct email address"
                break
            case 'phone_number':
                errors.phone_number = "Please provide correct phone number"
                break
            case 'matric_no':
                errors.matric_no = "Please provide correct matric number"
                break
            case 'gender':
                errors.gender = "Please provide gender"
                break
            case 'level':
                errors.level = "Please provide level"
                break
            case 'department':
                errors.department = "Please provide Department"
                break
            default:
                break
        }
    }
    if(Object.keys(errors).length > 0){
        res.render('admin/edit_student', {request: req.body, student: student, errors: errors, err_message: message})
    }else{
        try{
            student.full_name = req.body.full_name
            student.email_address = req.body.email_address
            student.phone_number = req.body.phone_number
            student.matric_no = req.body.matric_no
            student.gender = req.body.gender
            student.department = req.body.department
            student.level = req.body.level

            await student.save()
            req.flash('success', "Student updated Successfully!")
            res.redirect("/admin/students")
        }catch(e){
            if(e.name === 'MongoError' && e.code === 11000){
                message = "Email Or Phone or Matric Number exists already"
            }else{
                message = "Some Other Error(s) are there bro!"
            }
            res.render('admin/edit_student', {request: req.body, student: student, errors: errors, err_message: message})
        }
    }
})

router.get("/student/delete/:studentId", redirectLogin, async(req, res) => {
    const studentId = req.params.studentId
    let student
    try {
        student = await Student.findOne({_id: studentId}).exec()
        await student.remove()
        req.flash('failure', "Student Deleted Successfully!")
        res.redirect("/admin/students")
    }catch(e){
        req.flash('failure', "Error Deleting Student. Please try again")
        res.redirect("/admin/students")
    }
})

//Lecturer routes start here

router.get("/lecturers", redirectLogin, async(req, res) => {
    try{
        const lecturers = await Lecturer.find({}).sort({createdAt: 'desc'})
        res.render("admin/lecturers", {lecturers: lecturers})
    }catch(e){
        console.log(e)
        res.end("This is it.... Errrrrrrrrrr")
    }
})

router.get("/lecturer/create", redirectLogin, async(req, res) => {
    res.render("admin/create_lecturer", {request: {}, errors: {}, err_message: ""})
})

router.post("/lecturer/create", redirectLogin, async(req, res) => {
    const schema = Joi.object({
        full_name: Joi.string().min(3).max(100).required(),
        email_address: Joi.string().email(),
        phone_number: Joi.string().pattern(/^[0-9]{11,32}$/),
        staff_id: Joi.string().required(),
        title: Joi.string().required(),
        department: Joi.string().required(),
        password: Joi.string().pattern(/^[a-zA-Z0-9]{5,32}$/)
    })
    const {error, value} = schema.validate(req.body)
    const errors = {}
    let message
    if(error){
        switch(error.details[0].context.key){
            case 'full_name':
                errors.full_name = "Please provide full name with characters between 3 and 15"
                break
            case 'email_address':
                errors.password = "Please provide correct email address"
                break
            case 'phone_number':
                errors.phone_number = "Please provide correct phone number"
                break
            case 'staff_id':
                errors.staff_id = "Please provide correct staff ID"
                break
            case 'title':
                errors.title = "Please provide title"
                break
            case 'password':
                errors.password = "Please provide Password between 5 and 32 characters"
                break
            case 'department':
                errors.department = "Please provide Department"
                break
            default:
                break
        }
    }
    if(Object.keys(errors).length > 0){
        res.render("admin/create_lecturer", {request: req.body, errors: errors, err_message: "Got some errors there"})
    }else{
        var salt = bcrypt.genSaltSync(saltRounds)
        var hash = bcrypt.hashSync(req.body.password, salt)
        req.body.password = hash
        try{
            const lecturer = await Lecturer.create(req.body)
            req.flash('success', "Lecturer created Successfully")
            res.redirect("/admin/lecturers")
        }catch(e){
            if(e.name === 'MongoError' && e.code === 11000){
                message = "Email Or Phone or Staff ID exists already"
            }else{
                message = "Some Other Error(s) are there bro!"
            }
            res.render("admin/create_lecturer", {request: req.body, errors: {}, err_message: message})
        }
    }
})

router.get("/lecturer/edit/:lecturerId", redirectLogin, async(req, res) => {
    const lecturerId = req.params.lecturerId
    try{
        const lecturer = await Lecturer.findOne({_id: lecturerId}).exec()
        res.render("admin/edit_lecturer", {request: {}, lecturer: lecturer, errors: {}, err_message: ""})
    }catch(e){
        console.log(e)
        res.end("Errors are here")
    }
})

router.post("/lecturer/edit/:lecturerId", redirectLogin, async(req, res) => {
    const lecturerId = req.params.lecturerId
    let lecturer
    lecturer = await Lecturer.findOne({_id: lecturerId})
    const schema = Joi.object({
        full_name: Joi.string().min(3).max(100).required(),
        email_address: Joi.string().email(),
        phone_number: Joi.string().pattern(/^[0-9]{11,32}$/),
        staff_id: Joi.string().required(),
        title: Joi.string().required(),
        department: Joi.string().required(),
        password: Joi.string().pattern(/^[a-zA-Z0-9]{5,32}$/)
    })
    const {error, value} = schema.validate(req.body)
    const errors = {}
    let message
    if(error){
        switch(error.details[0].context.key){
            case 'full_name':
                errors.full_name = "Please provide full name with characters between 3 and 15"
                break
            case 'email_address':
                errors.password = "Please provide correct email address"
                break
            case 'phone_number':
                errors.phone_number = "Please provide correct phone number"
                break
            case 'staff_id':
                errors.staff_id = "Please provide correct staff ID"
                break
            case 'title':
                errors.title = "Please provide title"
                break
            case 'department':
                errors.department = "Please provide Department"
                break
            default:
                break
        }
    }
    if(Object.keys(errors).length > 0){
        res.render('admin/edit_lecturer', {request: req.body, lecturer: lecturer, errors: errors, err_message: message})
    }else{
        try{
            lecturer.full_name = req.body.full_name
            lecturer.email_address = req.body.email_address
            lecturer.phone_number = req.body.phone_number
            lecturer.staff_id = req.body.staff_id
            lecturer.title = req.body.title
            lecturer.department = req.body.department

            await lecturer.save()
            req.flash('success', "Lecturer updated Successfully!")
            res.redirect("/admin/lecturers")
        }catch(e){
            // console.log(e)
            if(e.name === 'MongoError' && e.code === 11000){
                message = "Email Or Phone or Staff ID exists already"
            }else{
                message = "Some Other Error(s) are there bro!"
            }
            res.render('admin/edit_lecturer', {request: req.body, lecturer: lecturer, errors: errors, err_message: message})
        }
    }
})

router.get("/lecturer/delete/:lecturerId", async(req, res) => {
    const lecturerId = req.params.lecturerId
    let lecturer
    try {
        lecturer = await Lecturer.findOne({_id: lecturerId}).exec()
        await lecturer.remove()
        req.flash('failure', "Lecturer Deleted Successfully!")
        res.redirect("/admin/lecturers")
    }catch(e){
        req.flash('failure', "Error Deleting Lecturer. Please try again")
        res.redirect("/admin/lecturers")
    }
})

//Courses routes start here

router.get("/courses", redirectLogin, async(req, res) => {
    try{
        const courses = await Course.find({}).sort({createdAt: 'desc'})
        res.render("admin/courses", {courses: courses})
    }catch(e){
        console.log(e)
        res.end("This is it.... Errrrrrrrrrr")
    }
})

router.get("/course/create", redirectLogin, async(req, res) => {
    res.render("admin/create_course", {request: {}, errors: {}, err_message: ""})
})

router.post("/course/create", redirectLogin, async(req, res) => {
    const schema = Joi.object({
        course_title: Joi.string().required(),
        course_code: Joi.string().required(),
        unit: Joi.string().min(1).max(7).required(),
        level:Joi.string().required()
    })

    const {error, value} = schema.validate(req.body)
    const errors = {}
    let message
    if(error){
        switch(error.details[0].context.key){
            case 'course_title':
                errors.course_title = "Please provide course title"
                break
            case 'course_code':
                errors.course_code = "Please provide course code"
                break
            case 'unit':
                errors.unit = "Please provide unit"
                break
            case 'level':
                errors.level = "Please provide level"
                break
            default:
                break
        }
    }
    if(Object.keys(errors).length > 0){
        res.render("admin/create_course", {request: req.body, errors: errors, err_message: "Got some errors there"})
    }else{
        try{
            const course = await Course.create(req.body)
            req.flash('success', "Course created Successfully")
            res.redirect("/admin/courses")
        }catch(e){
            console.log(e)
            if(e.name === 'MongoError' && e.code === 11000){
                message = "Course Code and Course Title may exist already"
            }else{
                message = "Some Other Error(s) are there bro!"
            }
            res.render("admin/create_course", {request: req.body, errors: {}, err_message: message})
        }
    }
})

router.get("/course/edit/:courseId", redirectLogin, async(req, res) => {
    const courseId = req.params.courseId
    try{
        const course = await Course.findOne({_id: courseId}).exec()
        res.render("admin/edit_course", {request: {}, course: course, errors: {}, err_message: ""})
    }catch(e){
        console.log(e)
        res.end("Errors are here")
    }
})

router.post("/course/edit/:courseId", redirectLogin, async(req, res) => {
    const courseId = req.params.courseId
    let course
    course = await Course.findOne({_id: courseId})
    const schema = Joi.object({
        course_title: Joi.string().required(),
        course_code: Joi.string().required(),
        unit: Joi.string().min(1).max(7).required(),
        level:Joi.string().required()
    })
    const {error, value} = schema.validate(req.body)
    const errors = {}
    let message
    if(error){
        switch(error.details[0].context.key){
            case 'course_title':
                errors.course_title = "Please provide course title"
                break
            case 'course_code':
                errors.course_code = "Please provide course code"
                break
            case 'unit':
                errors.unit = "Please provide unit"
                break
            case 'level':
                errors.level = "Please provide level"
                break
            default:
                break
        }
    }
    if(Object.keys(errors).length > 0){
        res.render('admin/edit_course', {request: req.body, course: course, errors: errors, err_message: message})
    }else{
        try{
            course.course_title = req.body.course_title
            course.course_code = req.body.course_code
            course.unit = req.body.unit
            course.level = req.body.level

            await course.save()
            req.flash('success', "Course updated Successfully!")
            res.redirect("/admin/courses")
        }catch(e){
            if(e.name === 'MongoError' && e.code === 11000){
                message = "Course Code and Course Title may exist already"
            }else{
                message = "Some Other Error(s) are there bro!"
            }
            res.render('admin/edit_course', {request: req.body, course: course, errors: errors, err_message: message})
        }
    }
})

router.get("/course/delete/:courseId", async(req, res) => {
    const courseId = req.params.courseId
    let course
    try {
        course = await Course.findOne({_id: courseId}).exec()
        await course.remove()
        req.flash('failure', "Course Deleted Successfully!")
        res.redirect("/admin/courses")
    }catch(e){
        req.flash('failure', "Error Deleting Lecturer. Please try again")
        res.redirect("/admin/courses")
    }
})

//Courses routes start here

router.get("/multimedia", redirectLogin, async(req, res) => {
    try{
        const multimedias = await Multimedia.find({}).sort({createdAt: 'desc'})
        // console.log(multimedias)
        res.render("admin/multimedias", {multimedias: multimedias})
    }catch(e){
        console.log(e)
        res.end("This is it.... Errrrrrrrrrr")
    }
})

router.get("/multimedia/create", redirectLogin, async(req, res) => {
    try{
        const courses = await Course.find({}).sort({createdAt: 'desc'})
        const lecturers = await Lecturer.find({}).sort({createdAt: 'desc'})
        res.render("admin/create_multimedia", {request: {}, errors: {}, err_message: "", courses: courses, lecturers: lecturers})
    }catch(e){
        console.log(e)
        res.end("This is it.... Errrrrrrrrrr")
    }
})

router.post("/multimedia/create", redirectLogin, upload.single('multimedia_file'), async(req, res) => {
    const courses = await Course.find({}).sort({createdAt: 'desc'})
    const lecturers = await Lecturer.find({}).sort({createdAt: 'desc'})
    const schema = Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        course: Joi.string().required(),
        file_type: Joi.string().required(),
        department: Joi.string().required(),
        level: Joi.string().required(),
        lecturers: Joi.array().items(Joi.string())
    })

    const {error, value} = schema.validate(req.body)
    const errors = {}
    let message
    if(error){
        switch(error.details[0].context.key){
            case 'title':
                errors.title = "Please provide multimedia title"
                break
            case 'description':
                errors.description = "Please provide multimedia description"
                break
            case 'file_type':
                errors.file_type = "Please provide file type"
                break
            case 'course':
                errors.course = "Please provide the course for which the multimedia was uploaded"
                break
            case 'department':
                errors.department = "Please provide department having access to the course"
                break
            case 'lecturers':
                errors.lecturers = "Please provide lecturers having access to the course"
                break
            case 'level':
                errors.level = "Please provide level having access to the course"
                break
            default:
                break
        }
    }
    if(Object.keys(errors).length > 0){
        res.render("admin/create_multimedia", {request: req.body, errors: errors, err_message: "Got some errors there", courses: courses, lecturers: lecturers})
    }else{
        // const fileName = req.file != null ? req.file.filename : null
        const fileName = req.file != null ? req.file.filename : null
        req.body.multimedia_file = fileName
        // res.status(201).json({request: req.body})
        try{
            const multimedia = await Multimedia.create(req.body)
            const course = await Course.findOne({_id: req.body.course}).exec()
            course.multimedias.push(multimedia._id)
            await course.save()
            req.flash('success', "Multimedia file uploaded Successfully!")
            res.redirect("/admin/multimedia")
        }catch(e){
            fs.unlink(path.join(__dirname, uploadPath + "/" + fileName), err => {
                if(err) console.log(err)
            })
            console.log(e)
            if(e.name === 'MongoError' && e.code === 11000){
                message = "Course Code and Course Title may exist already"
            }else{
                message = e.message//"Some Other Error(s) are there bro!"
            }
            res.render("admin/create_multimedia", {request: req.body, errors: {}, err_message: message, courses: courses, lecturers: lecturers})
        }
    }
})

router.get("/multimedia/edit/:multimediaId", redirectLogin, async(req, res) => {
    const multimediaId = req.params.multimediaId
    try{
        const courses = await Course.find({}).sort({createdAt: 'desc'})
        const lecturers = await Lecturer.find({}).sort({createdAt: 'desc'})
        const multimedia = await Multimedia.findOne({_id: multimediaId}).exec()
        res.render("admin/edit_multimedia", {request: {}, multimedia: multimedia, errors: {}, err_message: "", courses: courses, lecturers: lecturers})
    }catch(e){
        console.log(e)
        res.end("Errors are here")
    }
})

router.post("/multimedia/edit/:multimediaId", redirectLogin, upload.single('multimedia_file'), async(req, res) => {
    const courses = await Course.find({}).sort({createdAt: 'desc'})
    const lecturers = await Lecturer.find({}).sort({createdAt: 'desc'})
    const multimediaId = req.params.multimediaId
    let multimedia
    multimedia = await Multimedia.findOne({_id: multimediaId})
    console.log(multimedia)
    const schema = Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        course: Joi.string().required(),
        file_type: Joi.string().required(),
        department: Joi.string().required(),
        level: Joi.string().required(),
        lecturers: Joi.array().items(Joi.string())
    })

    const {error, value} = schema.validate(req.body)
    const errors = {}
    let message
    if(error){
        switch(error.details[0].context.key){
            case 'title':
                errors.title = "Please provide multimedia title"
                break
            case 'description':
                errors.description = "Please provide multimedia description"
                break
            case 'file_type':
                errors.file_type = "Please provide file type"
                break
            case 'course':
                errors.course = "Please provide the course for which the multimedia was uploaded"
                break
            case 'department':
                errors.department = "Please provide department having access to the course"
                break
            case 'lecturers':
                errors.lecturers = "Please provide lecturers having access to the course"
                break
            case 'level':
                errors.level = "Please provide level having access to the course"
                break
            case 'session':
                errors.session = "Please provide session"
                break
            case 'semester':
                errors.semester = "Please provide semester"
                break
            default:
                break
        }
    }
    if(Object.keys(errors).length > 0){
        res.render('admin/edit_multimedia', {request: req.body, multimedia: multimedia, errors: errors, err_message: message, courses: courses, lecturers: lecturers, multimedia: multimedia})
    }else{
        // console.log(req.file)
        const fileName = req.file != null && typeof req.file != 'undefined' ? req.file.filename + "." + req.file.originalname.split('.').pop() : null
        // console.log(fileName)
        if(fileName == null){
            return res.render('admin/edit_multimedia', {request: req.body, multimedia: multimedia, errors: errors, err_message: "Please provide Multimedia File", courses: courses, lecturers: lecturers, multimedia: multimedia})
        }

        try{
            multimedia.title = req.body.course_title
            multimedia.description = req.body.course_code
            multimedia.file_type = req.body.unit
            multimedia.course = req.body.level
            multimedia.lecturers = req.body.course_code
            multimedia.level = req.body.unit
            multimedia.session = req.body.level
            multimedia.semester = req.body.semester
            multimedia.multimedia_file = fileName

            await multimedia.save()
            req.flash('success', "Multimedia updated Successfully!")
            res.redirect("/admin/multimedia")
        }catch(e){
            fs.unlink(path.join(__dirname, uploadPath + "/" + fileName), err => {
                if(err) console.log(err)
            })
            if(e.name === 'MongoError' && e.code === 11000){
                message = "Course Code and Course Title may exist already"
            }else{
                message =  "Some Other Error(s) are there bro!"
            }
            res.render('admin/edit_multimedia', {request: req.body, multimedia: multimedia, errors: errors, err_message: message, courses: courses, lecturers: lecturers, multimedia: multimedia})
        }
    }
})

router.get("/multimedia/delete/:multimediaId", async(req, res) => {
    const multimediaId = req.params.multimediaId
    let multimedia
    try {
        multimedia = await Multimedia.findOne({_id: multimediaId}).exec()
        fs.unlink(path.join(__dirname, uploadPath + "/" + multimedia.multimedia_file.split('.').slice(0, -1).join('.')), err => {
            if(err) console.log(err)
        })
        await multimedia.remove()
        req.flash('failure', "Multimedia Deleted Successfully!")
        res.redirect("/admin/multimedia")
    }catch(e){
        req.flash('failure', "Error Deleting Multimedia. Please try again")
        res.redirect("/admin/multimedia")
    }
})

module.exports = router
