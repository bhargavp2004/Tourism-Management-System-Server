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
const cors = require('cors');


//************Registeration************* */


router.post('/register', async (req, res) => {

  const { firstname, lastname, email, username, password, mobilenumber } = req.body;

  console.log(firstname);
  console.log(lastname);
  // Check if a user with the same email or username already exists
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });

  const hashedPassword = await bcrypt.hash(password, saltRounds);

  if (existingUser) {
    console.log(existingUser);
    return res.status(500).json({ exist: true });
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
    return res.status(201).json({ msg: "Registration Successful" });
  } catch (error) {
    return res.status(500).json({ error: "Registration Failed" });
  }
});



//***********Login************* */


router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  console.log(username);
  console.log(password);

  try {
    // Check if a user with the provided username exists
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ error: "Incorrect username or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    // Validate the password
    if (!passwordMatch) {
      return res.status(400).json({ error: "Incorrect username or password" });
    }
    return res.status(200).json({ statusCode: 200, msg: "Login Successful" });
  } catch (error) {
    return res.json({ statusCode: 500, error: "Login Failed" });
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


//**********Add Place********** */

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


//********* */


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
const Package = mongoose.model("Package", packageSchema);




router.post('/addPackage', async (req, res) => {
  try {
    const { package_name, package_overview, package_days, package_price, place } = req.body;

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


//***********Book Tour Package************* */
const bookingSchema = require("../Models/bookingSchema");
const Booking = mongoose.model("Booking", bookingSchema);

router.post('/book', async (req, res) => {
  try {
    const { book_date, book_adult, book_child, book_cost, book_user, book_pack } = req.body;

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
    res.status(400).json({ error: error.message });
  }
});


//*********Update User************** */

router.post('/updateUser', async (req, res) => {
  const { username, newUsername, newPassword, newFirstName, newLastName, newEmail, newMobileNumber } = req.body;
  console.log(username);

  const existingUser = await User.findOne({ username });

  if (existingUser) {
    if (newUsername != null) {
      const usernameExist = await User.findOne({ username: newUsername });

      if (usernameExist) {
        return res.status(422).json({ error: "User with same username already exists. Please opt for another username" });
      }


    }

    if (newEmail) {
      const emailExist = await User.findOne({ email: newEmail });

      if (emailExist) {
        return res.status(422).json({ error: "User with same email already exists. Please provide another email address" });
      }
      existingUser.email = newEmail;
    }
    if (newFirstName) {
      existingUser.firstname = newFirstName;
    }
    if (newLastName) {
      existingUser.lastname = newLastName;
    }
    if (newEmail) {
      existingUser.email = newEmail;
    }
    if (newMobileNumber) {
      existingUser.mobilenumber = newMobileNumber;
    }

    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      existingUser.password = hashedPassword;
    }

  }

  existingUser.save().then((result) => {
    console.log("User saved");
  }).catch((err) => {
    console.log("failed");
  })
  return res.send(existingUser);
});



router.post('/updateAdmin', async (req, res) => {
  const { username, newUsername, newPassword, newFirstName, newLastName, newEmail, newMobileNumber } = req.body;


  if (newUsername) {
    const existingAdminNew = await Admin.findOne({ username: newUsername });

    if (existingAdminNew) {
      return res.status(400).json({ error: "Admin with the same email or username already exists" });
    }
  }

  const existingAdmin = await User.findOne({ username });


  if (newUsername) {
    existingAdmin.username = newUsername;
  }
  if (newFirstName) {
    existingAdmin.firstname = newFirstName;
  }
  if (newLastName) {
    existingAdmin.lastname = newLastName;
  }
  if (newEmail) {
    existingAdmin.email = newEmail;
  }
  if (newMobileNumber) {
    existingAdmin.mobilenumber = newMobileNumber;
  }

  if (newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    existingAdmin.password = hashedPassword;
  }
  existingAdmin.save().then((result) => {
    console.log("Admin saved");
  }).catch((err) => {
    console.log("failed");
  })
  return res.send(existingAdmin);
});

router.post('/updatePackage', async (req, res) => {
  const { package_name, new_name, package_overview, package_days, package_price, place } = req.body;


  if (new_name) {
    const existingPackageNew = await Package.findOne({ package_name: new_name });

    if (existingPackageNew) {
      return res.status(400).json({ error: "Package with the same name exists" });
    }
  }

  const existingPackage = await Package.findOne({ package_name });


  if (new_name) {
    existingPackage.package_name = new_name;
  }
  if (package_overview) {
    existingPackage.package_overview = package_overview;
  }
  if (package_days) {
    existingPackage.package_days = package_days;
  }
  if (package_price) {
    existingPackage.package_price = package_price;
  }
  if (place) {
    const selectedPlaces = await Place.find({ place_name: { $in: place } });
    existingPackage.package_place = selectedPlaces.map(place => place._id);
  }

  existingPackage.save().then((result) => {
    console.log("Package saved");
  }).catch((err) => {
    console.log("failed");
  })
  return res.send(existingPackage);
});


router.post('/updatePlace', async (req, res) => {
  const { place_name, place_newname, place_desc } = req.body;



  if (place_newname) {
    const existingPlaceNew = await Place.findOne({ place_name: place_newname });

    if (existingPlaceNew) {
      return res.status(400).json({ error: "Place with the same name exists" });
    }
  }

  const existingPlace = await Place.findOne({ place_name });


  if (place_newname) {
    existingPlace.place_name = place_newname;
  }
  if (place_desc) {
    existingPlace.place_desc = place_desc;
  }

  existingPlace.save().then((result) => {
    console.log("Place saved");
  }).catch((err) => {
    console.log("failed");
  })
  return res.send(existingPlace);
});


router.post('/deleteUser', async (req, res) => {
  const { username } = req.body;

  try {
    const result = await User.deleteOne({ username });
    console.log(result.deletedCount, 'document(s) deleted');
  } catch (error) {
    console.error('Error deleting document:', error);
  }
});

router.post('/deletePlace', async (req, res) => {
  const { name } = req.body;
  console.log(name);
  try {
    const result = await Place.deleteOne({ place_name: name });
    console.log(result.deletedCount, 'document(s) deleted');
  } catch (error) {
    console.error('Error deleting document:', error);
  }
});

router.post('/deletePackage', async (req, res) => {
  const { name } = req.body;
  console.log(name);
  try {
    const result = await Package.deleteOne({ package_name: name });
    console.log(result.deletedCount, 'document(s) deleted');
  } catch (error) {
    console.error('Error deleting document:', error);
  }
});

router.post('/deleteBooking', async (req, res) => {
  const { user } = req.body;
  console.log(user);
  try {
    const result = await Booking.deleteOne({ _id: user });
    console.log(result.deletedCount, 'document(s) deleted');
  } catch (error) {
    console.error('Error deleting document:', error);
  }
});



module.exports = router;
