const mongoose = require('mongoose');
const userSchema = require("./Models/userSchema");
const url = `mongodb+srv://bhargavp2004:7094692828bhargav@tourismmanagement.vapyc9c.mongodb.net/mydb?retryWrites=true&w=majority`;
const express = require('express');
const app = express();
const portnumber = 5000;
const cors = require('cors');
app.use(cors());
app.use(express.json());
app.use(require('./Router/Auth'));
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
const path = require('path');
app.set('views', path.join(__dirname, 'views'));

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