const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const userSchema = require("../Models/userSchema"); // Import your User model
const User = mongoose.model("User", userSchema);
const placeSchema = require("../Models/placeSchema");
const Place = mongoose.model("Place", placeSchema);
const packageSchema = require("../Models/packageSchema");
const Package = mongoose.model("Package", packageSchema);
const bookingSchema = require("../Models/bookingSchema");
const Booking = mongoose.model("Booking", bookingSchema);
const guideSchema = require("../Models/guideSchema");
const Guide = mongoose.model("Guide", guideSchema);
const commentSchema = require("../Models/commentSchema");
const Comment = mongoose.model("Comment", commentSchema);
const announcementSchema = require("../Models/announcementSchema");
const Announcement = mongoose.model("Announcement", announcementSchema);
const adminSchema = require("../Models/adminSchema");
const Admin = mongoose.model("Admin", adminSchema);
const imageSchema = require("../Models/imageSchema");
const Image = mongoose.model("Image", imageSchema);
const bcrypt = require('bcrypt');
const packageDateSchema = require('../Models/packageDates');
const PackageDates = mongoose.model("PackageDates", packageDateSchema);
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const secretKey = "THISISMYSECURITYKEYWHICHICANTGIVEYOU";

 // Store files in memory as buffers
// const upload = multer({ storage: storage, limits: { fileSize: 1024 * 1024 * 10 } });  //Configuring file size which can be uploaded
const cors = require('cors');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// USER //
router.post('/register', async (req, res) => {
  console.log("inside register");
  const { firstname, lastname, email, username, password, mobilenumber } = req.body;
  console.log("after destructuring");
  // Check if a user with the same email or username already exists
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  console.log("after existing user");
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  console.log("after hashing");
  if (existingUser) {
    return res.status(400).json({ error: "User with the same email or username already exists" });
  }

  // If user doesn't exist, create a new user and save
  console.log("Creating new user");
  const newUser = new User({
    firstname,
    lastname,
    email,
    username,
    password: hashedPassword,
    mobilenumber
  });

  console.log("Getting into try block");
  try {
    console.log("Before");
    await newUser.save();
    const payload = {
      user: {
        id: newUser._id,
        username: newUser.username,
      },
    };

    // Sign the JWT token with the payload and secret key
    const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });
    // Send the token as a response
    console.log("Registration Successful!");
    res.cookie('token', token, { httpOnly: true });
    return res.status(200).json({ msg: "Registration Successful", token});
  } catch (error) {
    console.log("Registration Failed:", error);
    return res.status(401).json({ error: "Registration Failed" });
  }
});



router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if a user with the provided username exists
    const user = await User.findOne({ username: username });
    const admin = await Admin.findOne({username :username });
    console.log(username);
    console.log(user);
    console.log(admin);

    if (!user && !admin) {
      return res.status(401).json({ error: "Incorrect Username or Password" });
    }
    else if(user){
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Incorrect Username or Password" });
      }
      const payload = {
        user: {
          id: user._id,
          username: user.username,
        },
      };
      const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });
      console.log(token);
      res.cookie('token', token, { httpOnly: true });
      return res.status(200).json({ msg: "Login Successful" , token});
    }
    else{
      console.log("Admin");
      console.log(password);
      const passwordMatch = await Admin.findOne({password:password });
     
      if (!passwordMatch) {
        return res.status(401).json({ error: "Incorrect Username or Password" });
      }
      const payload = {
        admin: {
          id: admin._id,
          username: admin.username,
        },
      };
      
      const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });
      console.log(token);
      res.cookie('token', token, { httpOnly: true });
      console.log(passwordMatch);
      return res.status(201).json({ msg: "Login Successful", token });
    }

  } catch (error) {
    console.log("Login Failed:", error);
    return res.status(401).json({ error: "Login Failed" });
  }
});

function verifyTokenFromSessionOrCookie(req, res, next) {
  const token = req.session?.token || req.cookies?.token;
  console.log("Inside Verification Function");
  console.log(token);
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token is not valid' });
  }
}

// Error handling middleware
router.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});


router.post('/updateUser', async (req, res) => {
  const { username, newUsername, newPassword, newFirstName, newLastName, newEmail, newMobileNumber } = req.body;
  console.log(username);

  if (newUsername) {
    const existingUserNew = await User.findOne({ username: newUsername });

    if (existingUserNew) {
      return res.status(400).json({ error: "User with the same email or username already exists" });
    }
  }
  const existingUser = await User.findOne({ username });
  
  if (newUsername) {
    existingUser.username = newUsername;
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
  existingUser.save().then((result) => {
    console.log("User saved");
  }).catch((err) => {
    console.log("failed");  
  })
  return res.send(existingUser);
});



router.post('/deleteUser', async (req, res) => {
  const {userid} = req.body;

  try {
    const result = await User.deleteOne({ _id : userid });
    await Comment.deleteMany({user : userid});
    await Booking.deleteMany({user : userid});
    console.log(result.deletedCount, 'document(s) deleted');
  } catch (error) {
    console.error('Error deleting document:', error);
  }
});


router.post('/bookPackage', async (req, res) => {
  try {
    const { package_name, package_overview, package_days, package_price, package_place, package_guide} = req.body;

    // Find the selected places by their IDs
    const selectedPlaces = await Place.find({ _id: { $in: package_place } });

    // Create a new package with the selected places references
    const newPackage = new Package({
      package_name,
      package_overview,
      package_days,
      package_price,
      package_place: selectedPlaces.map(place => place._id),
      package_guide   
    });

    await newPackage.save();

    res.status(201).json(newPackage);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// PLACE //




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



router.post("/addPlace", upload.single("image"), async (req, res) => {
  try {
    const { place_name, place_desc, title } = req.body;

    if (!place_name || !place_desc || !title || !req.file) {
      return res.status(400).json({ error: "Fill all the fields properly" });
    }

    const image = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
    };

    const newPlace = new Place({ place_name, place_desc, title, image });
    await newPlace.save();

    res.status(201).json(newPlace);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "An error occurred while processing your request." });
  }
});


router.get('/fetchImage/:id', async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);

    const place = await Place.findOne({ _id: id });

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

router.get('/places', async (req, res) => {
  const places = await Place.find({});
  
  res.json(places);
});

router.get('/places/:id', async (req, res) => {
  const id = req.params.id;
  const place = await Place.findOne({_id : id});
  res.json(place);
});


router.put('/updatePlace/:id', upload.single('image'), async (req, res) => {
  const { place_name, place_desc } = req.body;
  const id = req.params.id;

  try {
    const existingPlace = await Place.findByIdAndUpdate(id, {
      place_name,
      place_desc,
      image: {
        data: req.file.buffer, // Updated image data
        contentType: req.file.mimetype, // Updated content type
      },
    }, { new: true });

    if (!existingPlace) {
      return res.status(404).json({ message: 'Place not found' });
    }

    return res.json(existingPlace);
  } catch (error) {
    console.error('Error updating place:', error);
    return res.status(500).json({ message: 'Failed to update place' });
  }
});



router.post("/deletePlace/:id", async (req, res) => {
  const id = req.params.id;

  try {
    // Check if the guide exists
    const place = await Place.findById(id);

    if (!place) {
      return res.status(404).json({ message: "Place not found" });
    }

    // Perform any additional checks here before deleting (e.g., if the guide is associated with any data)

    // Delete the guide
    await Place.deleteOne({ _id: id });
  } catch (error) {
    console.error("Error deleting Place:", error);
    res.status(500).json({ message: "An error occurred while deleting the Place" });
  }
});




//  PACKAGE   //




router.post('/addPackage', async (req, res) => {
  try {
    const { package_name, package_overview, package_days, package_price, package_capacity, package_place, package_guide, start_date, end_date} = req.body;

    // Find the selected places by their IDs
    const selectedPlaces = await Place.find({ _id: { $in: package_place } });

    // Create a new package with the selected places references
    const newPackage = new Package({
      package_name,
      package_overview,
      package_days,
      package_price,
      package_capacity,
      package_place: selectedPlaces.map(place => place._id),
      package_guide   
    });

    await newPackage.save();
    const pack_id = newPackage._id;
    const pds = new PackageDates({
      package_id : pack_id, start_date, end_date
    });

    await pds.save();

    res.status(201).json(newPackage);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/packages', async (req, res) => {
  const package = await Package.find({});
  res.json(package);
});

router.get('/packages/:id', async (req, res) => {
  const id = req.params.id;
  const package = await Package.findOne({_id : id});
  res.json(package);
});

router.get('/getplaces/:id', async (req, res) => {
  const packageId = req.params.id;

  try {
    const package = await Package.findById(packageId).populate('package_place');

    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }

    // Extract associated places from the package document
    const associatedPlaces = package.package_place;
    

    res.json(associatedPlaces);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/updatePackage/:id', async (req, res) => {
  const { package_name, package_overview, package_days, package_price, package_place, package_guide } = req.body;
  const id = req.params.id;

  try {
    const existingPackage = await Package.findByIdAndUpdate(id, {
      package_name,
      package_overview,
      package_days,
      package_price,
      package_place,
      package_guide,
    }, { new: true });

    if (!existingPackage) {
      return res.status(404).json({ message: 'Package not found' });
    }

    return res.json(existingPackage); // Send the updated package data in response
  } catch (error) {
    console.error('Error updating package:', error);
    return res.status(500).json({ message: 'Failed to update package' });
  }
});



router.post('/deletePackage/:id', async (req, res) => {
  const id = req.params.id;
  console.log(id);
  try {
    const ask = await Booking.findOne({ book_pack: id });
    if (ask == null) {
      const result = await Package.deleteOne({ _id: id });
      return res.status(200).json({ message: 'Package deleted' });
    } else {
      if (ask !== null) {
        return res.status(400).json({ message: 'Package is booked by someone' });
      }
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});





// COMMENT  //




router.post('/addComment', async (req, res) => {
  try {
    const {comment_desc, username, pack} = req.body;

    // Find the selected places by their IDs
    const selectedUser = await User.find({username});

    // Create a new package with the selected places references
    const newComment = new Comment({
      comment_desc,
      User: selectedUser,
    });

    await newComment.save();

    const selectedPack = await Package.find({pack});

    selectedPack.package_comment = newComment;

    res.status(201).json(newComment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});



router.post('/deleteComment', async (req, res) => {
  const {comment} = req.body;
  console.log(name);
  try {

    const result = await Comment.deleteOne({ _id : comment });
    await Package.updateMany(
      { package_guide: guide },
      { $unset: { package_guide: 1 } }
    );
    console.log(result.deletedCount, 'document(s) deleted');
  } catch (error) {
    console.error('Error deleting document:', error);
  }
});




// BOOKING PACKAGE  //




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
    res.status(400).json({ error: error.message });
  }
});


router.post('/bookSelectedPackage', async (req, res) => {
  const package_name = req.body.package_name;
  const pack = await Package.findOne({package_name : package_name});

  console.log(pack);
  return res.json({message : `Selected ${package_name}`});
})


router.post('/deleteBooking', async (req, res) => {
  const {user} = req.body;
  console.log(user);
  try {
    const result = await Booking.deleteOne({_id :  user});
    console.log(result.deletedCount, 'document(s) deleted');
  } catch (error) {
    console.error('Error deleting document:', error);
  }
});




//   ADMIN   //




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



router.post('/deleteAdmin', async (req, res) => {
  const {admin} = req.body;
  console.log(user);
  try {
    const result = await Admin.deleteOne({_id :  admin});
    console.log(result.deletedCount, 'document(s) deleted');
  } catch (error) {
    console.error('Error deleting document:', error);
  }
});




// GUIDE




router.post('/addGuide', async (req, res) => {
  const { firstname, lastname, email, username, password, mobilenumber } = req.body;

  // Check if a user with the same email or username already exists
  const existingGuide = await Guide.findOne({ $or: [{ email }, { username }] });

  const hashedPassword = await bcrypt.hash(password, saltRounds);

  if (existingGuide) {
    return res.status(400).json({ error: "Guide with the same email or username already exists" });
  }

  // If user doesn't exist, create a new user and save
  const newGuide = new Guide({
    firstname,
    lastname,
    email,
    username,
    password: hashedPassword,
    mobilenumber
  });

  try {
    const savedUser = await newGuide.save();
    console.log("Registration Successful!");
    return res.status(201).json({ msg: "Registration Successful" });
  } catch (error) {
    console.log("Registration Failed:", error);
    return res.status(500).json({ error: "Registration Failed" });
  }
});

router.get('/guideUsernames', async (req, res) => {
  try {
    // Find all guides and project only the 'username' field
    const guides = await Guide.find({}, 'username');

    // Create an object with guide IDs as keys and usernames as values
    const guideUsernames = {};
    guides.forEach((guide) => {
      guideUsernames[guide._id.toString()] = guide.username;
    });

    res.json(guideUsernames);
  } catch (error) {
    console.error("Error fetching guide usernames:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get('/guide/:id', async (req, res) => {
  const id = req.params.id;
  console.log(id);
  const guide = await Guide.findOne({_id : id});
  res.json(guide);
});

router.get('/guides', async (req, res) => {
  const guides = await Guide.find({});
  res.json(guides);
});


router.put('/updateGuide/:id', async (req, res) => {
  const { firstname, lastname, email, username, mobilenumber} = req.body;
  const id = req.params.id;

  try {
    const existingGuide = await Guide.findByIdAndUpdate(id, {
      firstname,
      lastname,
      email,
      username,
      mobilenumber,
    }, { new: true });

    if (!existingGuide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    return res.json(existingGuide); // Send the updated package data in response
  } catch (error) {
    console.error('Error updating Guide:', error);
    return res.status(500).json({ message: 'Failed to update Guide' });
  }
});



router.post("/deleteGuide/:id", async (req, res) => {
  const id = req.params.id;

  try {
    // Check if the guide exists
    const guide = await Guide.findById(id);

    if (!guide) {
      return res.status(404).json({ message: "Guide not found" });
    }

    // Perform any additional checks here before deleting (e.g., if the guide is associated with any data)

    // Delete the guide
    await Guide.deleteOne({ _id: id });
  } catch (error) {
    console.error("Error deleting Guide:", error);
    res.status(500).json({ message: "An error occurred while deleting the Guide" });
  }
});

// router.post('/deletePackage/:id', async (req, res) => {
//   const id = req.params.id;
//   console.log(id);
//   try {
//     const ask = await Booking.findOne({ book_pack: id });
//     if (ask == null) {
//       const result = await Package.deleteOne({ _id: id });
//       return res.status(200).json({ message: 'Package deleted' });
//     } else {
//       if (ask !== null) {
//         return res.status(400).json({ message: 'Package is booked by someone' });
//       }
//     }
//   } catch (error) {
//     console.error('Error deleting document:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });




// Announcement //




router.post('/addAnnouncement', async (req, res) => {
  try {
    const {announcement_desc, bpack} = req.body;

    // Find the selected places by their IDs
    const selectedPack = await Package.find({bpack});

    // Create a new package with the selected places references
    const newComment = new Comment({
      announcement_desc,
      Booking: selectedPack,
    });

    await newComment.save();

    

    selectedPack.package_comment = newComment;

    res.status(201).json(newComment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});



router.post('/getAnnouncement' , async(req, res) =>{
    const{userid} = req.body;

    const selectedPack = await Package.find({book_user : userid});

    const announcement = await Announcement.find({Booking : selectedPack._id});

    res.render('Announcemet-details', { announcement});
});



module.exports = router;