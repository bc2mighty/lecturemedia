const mongoose = require("mongoose")

const studentSchema = new mongoose.Schema({
    full_name: {
        type: String,
        required: true
    },
    matric_no: {
        type: String,
        required: true,
        unique: true
    },
    email_address: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone_number: {
        type: String,
        required: true,
        unique: true
    },
    level: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Student', studentSchema)
