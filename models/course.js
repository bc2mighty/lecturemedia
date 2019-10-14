const mongoose = require("mongoose")

const courseSchema = new mongoose.Schema({
    course_title: {
        type: String,
        required: true,
        unique: true
    },
    course_code: {
        type: String,
        required: true,
        unique: true
    },
    unit: {
        type: String,
        required: true
    },
    level: {
        type: String,
        required: true
    },
    multimedias: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Multimedia"
      }
    ]
    ,
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Course', courseSchema)
