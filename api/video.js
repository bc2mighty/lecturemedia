const express = require("express")
const router = express.Router()
const Multimedia = require("../models/multimedia")
const fs = require("fs")

router.get("/multimedia", async(req, res) => {
    res.end("Hi there");
})

router.get("/", async(req, res) => {
    res.end("Here")
})

router.get("/multimedia/:multimediaId", async(req, res) => {
      const multimediaId = req.params.multimediaId
      try{
          const multimedia = await Multimedia.findOne({_id: multimediaId}).sort({createdAt: 'desc'}).populate('course lecturers')
          console.log(multimedia)
          const path = multimedia.multimediaPath
          const stat = fs.statSync(path)
          const fileSize = stat.size
          const range = req.headers.range
          if (range) {
            const parts = range.replace(/bytes=/, "").split("-")
            const start = parseInt(parts[0], 10)
            const end = parts[1]
              ? parseInt(parts[1], 10)
              : fileSize-1
            const chunksize = (end-start)+1
            const file = fs.createReadStream(path, {start, end})
            const head = {
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': chunksize,
              'Content-Type': 'video/mp4',
            }
            res.writeHead(206, head);
            file.pipe(res);
          } else {
            const head = {
              'Content-Length': fileSize,
              'Content-Type': 'video/mp4',
            }
            res.writeHead(200, head)
            fs.createReadStream(path).pipe(res)
          }
      }catch(e){
          console.log(e)
          res.status(400).json({'status':'-1','message':'You have some errors there','error':e})
      }
})

module.exports = router
