if(process.env.NODE_ENV !== "production"){
    require("dotenv").config({path: __dirname + "/.env"})
}

const express = require("express")
const app = express()
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const expressLayouts = require("express-ejs-layouts")
const path = require("path")

const flash = require("connect-flash")

app.use(require("express-session")({
    name: "sid",
    secret:"The milk would do that",
    resave: false,
    saveUninitialized: false
}))

app.use(flash())
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'public/uploads/multimedia')))
app.use(bodyParser.urlencoded({extended: false, limit: "10mb"}))

app.use(bodyParser.json({limit: "5mb"}))
mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection
db.on("error",error => console.log("Error Connecting" + error))
db.on("open", () => console.log("Connected"))

mongoose.set('useNewUrlParser', true)
mongoose.set('useFindAndModify', false)
mongoose.set('useCreateIndex', true)

app.use(function(req, res, next){
    res.locals.message = req.flash()
    // console.log(res.locals)
    next()
});

app.set("view engine","ejs")
app.set("views",__dirname + "/views")

app.get("/", (req, res) => {
    res.send("Landing page")
})

const indexRouter = require("./routes/index")
const apiRouter = require("./api/video")
const studentRouter = require("./routes/student")
const adminRouter = require("./routes/admin")
const chatRouter = require("./api/chat")
const userRouter = require("./api/user")

app.use("/admin", adminRouter)
app.use("/", indexRouter)
app.use("/student", studentRouter)
app.use("/api", apiRouter)
app.use("/chat", chatRouter)
app.use("/user", userRouter)

app.listen(process.env.PORT || 3000, () => {
  console.log("Server Started on port 3000!")
})
