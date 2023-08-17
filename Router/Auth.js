const express = require('express');
const router = express.Router();
const userSchema = require('../Models/userSchema'); // Import your User model
const mongoose = require('mongoose');
const User = mongoose.model('User', userSchema);
const bcrypt = require('bcrypt');
const saltRounds = 10;
const multer = require('multer');
const storage = multer.memoryStorage(); // Store files in memory as buffers
const upload = multer({ storage: storage, limits: { fileSize: 1024 * 1024 * 10 } });  //Configuring file size which can be uploaded
const Image = require('../Models/imageSchema');

router.post('/register', async (req, res) => {
  const { firstname, lastname, email, username, password, mobilenumber } = req.body;

  // Check if a user with the same email or username already exists
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });

  const hashedPassword = await bcrypt.hash(password, saltRounds);

  if (existingUser) {
    return res.status(400).json({ error: "User with the same email or username already exists" });
  }

  // If user doesn't exist, create a new user and save
  const newUser = new User({
    firstname,
    lastname,
    email,
    username,
    password: hashedPassword,
    mobilenumber
  });

  try {
    const savedUser = await newUser.save();
    console.log("Registration Successful!");
    return res.status(201).json({ msg: "Registration Successful" });
  } catch (error) {
    console.log("Registration Failed:", error);
    return res.status(500).json({ error: "Registration Failed" });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if a user with the provided username exists
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    // Validate the password
    if (!passwordMatch) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    console.log("Login Successful!");
    return res.status(200).json({ msg: "Login Successful" });
  } catch (error) {
    console.log("Login Failed:", error);
    return res.status(500).json({ error: "Login Failed" });
  }
});

router.post('/upload', upload.single('image'), async (req, res) => {
  console.log(req.body.title);
  try {
    const image = new Image({
      title: req.body.title,
      image: req.file.buffer,
    });
    await image.save();
    res.status(201).send('Image uploaded successfully');
  } catch (error) {
    res.status(500).send('Error uploading image');
  }
});

const placeSchema = require('../Models/placeSchema');
const Place = mongoose.model('Place', placeSchema);

router.post('/addPlace', upload.single('image'), async (req, res) => {

  try {
    const { place_name, place_desc, title } = req.body;
    const image = {
      data: req.file.buffer,
      contentType: req.file.mimetype
    };

    const newPlace = new Place({ place_name, place_desc, title, image });
    console.log(newPlace.place_name);
    await newPlace.save();

    res.status(201).json(newPlace);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/fetchImage/:name', async (req, res) => {
  try {
    const placeName = req.params.name;
    console.log(placeName);

    const place = await Place.findOne({ place_name: placeName });

    if (!place || !place.image) {
      return res.status(404).send('Place or Image not found');
    }

    res.contentType('image/jpeg'); // Set the content type based on your image format
    res.send(place.image.buffer); // Assuming the image data is stored in a Buffer field
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/placeDetails/:name', async (req, res) => {
  try {
    const placeName = req.params.name;
    const place = await Place.findOne({ place_name: placeName });

    if (!place) {
      return res.status(404).send('Place not found');
    }
    console.log(place.image);
    res.render('place-details', { place });
  } catch (error) {
    console.error('Error fetching place details:', error);
    res.status(500).send('Internal Server Error');
  }
});

const packageSchema = require("../Models/packageSchema");
const Package = mongoose.model("Package", packageSchema);

router.post('/addPackage', async (req, res) => {
  try {
    const { package_name, package_overview, package_days, package_price, place} = req.body;

    // Find the selected places by their IDs
    const selectedPlaces = await Place.find({ place_name: { $in: place } });

    // Create a new package with the selected places references
    const newPackage = new Package({
      package_name,
      package_overview,
      package_days,
      package_price,
      package_place: selectedPlaces.map(place => place._id),
    });

    await newPackage.save();

    res.status(201).json(newPackage);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const bookingSchema = require("../Models/bookingSchema");
const Booking = mongoose.model("Booking", bookingSchema);

router.post('/book', async (req, res) => {
  try {
    const { book_date, book_adult, book_child, book_cost, book_user, book_pack} = req.body;

    // Find the selected places by their IDs
    const selectedUser = await User.find({ username: book_user });
    const selectedPack = await Package.find({ package_name: book_pack });

    // Create a new package with the selected places references
    const newBook = new Booking({
      book_date,
      book_adult,
      book_child,
      book_cost,
      book_user: selectedUser.map(book_user => book_user._id),
      book_pack: selectedPack.map(book_pack => book_pack._id)
    });

    await newBook.save();

    res.status(201).json(newBook);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
module.exports = router;
