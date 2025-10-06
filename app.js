const express = require('express');
const userRouter = require('./routes/user.routes')
const app = express();
const dotenv = require('dotenv')
const path = require('path');
const fs = require('fs');
dotenv.config();
const connectToDB = require("./config/db")
connectToDB();
const cookieParser = require('cookie-parser');
const indexRouter = require('./routes/index.routes')

app.set("view engine", "ejs");

app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
// ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
// serve static uploads, including nested user folders
app.use('/uploads', express.static(uploadsDir, { extensions: false }));
app.use('/user', userRouter);
app.use('/', indexRouter)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})