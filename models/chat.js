const mongoose = require("mongoose")

const chatSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    multimediaId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Multimedia'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model("Chat", chatSchema)
