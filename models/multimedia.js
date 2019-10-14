const mongoose = require("mongoose")
const multimediaBasePath = "public/uploads/multimedia"
const multimediaPath = "uploads/multimedia"
const path = require("path")

const multimediaSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    multimedia_file: {
        type: String,
        required: true
    },
    file_type: {
        type: String,
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Course'
    },
    lecturers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lecturer'
    }],
    department: {
        type: String,
        required: true
    },
    level: {
        type: String,
        required: true
    },
    session: {
        type: String,
        required: true
    },
    semester: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

multimediaSchema.virtual('multimediaPath').get(function(){
    if(this.multimedia_file != null){
        return path.join("/",multimediaPath,this.multimedia_file)
    }
})

module.exports = mongoose.model('Multimedia', multimediaSchema)
module.exports.multimediaBasePath = multimediaBasePath
