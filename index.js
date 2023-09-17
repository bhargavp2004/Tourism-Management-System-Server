const mongoose = require('mongoose');
const userSchema = require("./Models/userSchema");
const url = `mongodb+srv://mongodbrahul:iamrahul90586@cluster0.hvew3zs.mongodb.net/?retryWrites=true&w=majority`;
const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const portnumber = 5000;
const cors = require('cors');
app.use(cors());
app.use(express.json());
app.use(require('./Router/Auth'));
app.use(cookieParser());
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
const path = require('path');
app.set('views', path.join(__dirname, 'views'));
const session = require('express-session');
app.use(session({
  secret: 'THISISMYSECURITYKEYWHICHICANTGIVEYOU',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if you're using HTTPS
}));

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to the database!");
  })
  .catch((err) => {
    console.error("Error connecting to the database:", err);
  });

app.listen(portnumber, () => {
  console.log("Application started on port number " + portnumber);
})