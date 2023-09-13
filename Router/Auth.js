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
const saltRounds = 10;

 // Store files in memory as buffers
// const upload = multer({ storage: storage, limits: { fileSize: 1024 * 1024 * 10 } });  //Configuring file size which can be uploaded
const cors = require('cors');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });





// USER //



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
    const admin = await Admin.findOne({username });

    if (!user && !admin) {
      return res.status(404).json({ error: "User not found" });
    }
    else if(user){
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Incorrect password" });
      }
      return res.status(200).json({ msg: "Login Successful" });
    }
    else{
      console.log("Admin");
      console.log(password);
      const passwordMatch = await Admin.findOne({password:password });
      console.log(passwordMatch);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Incorrect password" });
      }
      return res.status(201).json({ msg: "Login Successful" });
    }
    

    
  } catch (error) {
    console.log("Login Failed:", error);
    return res.status(500).json({ error: "Login Failed" });
  }
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
    console.log(error.message);
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

router.get('/places', async (req, res) => {
  const places = await Place.find({});
  
  res.json(places);
});




router.post('/updatePlace', async (req, res) => {
  const { place_name, place_newname, place_desc} = req.body;

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



router.post('/deletePlace', async (req, res) => {
  const {name} = req.body;
  console.log(name);
  try {
    const result = await Place.deleteOne({ place_name : name });
    await Package.updateMany(
      { package_place: name },
      { $unset: { package_place: 1 } }
    );
    console.log(result.deletedCount, 'document(s) deleted');
  } catch (error) {
    console.error('Error deleting document:', error);
  }
});




//  PACKAGE   //




router.post('/addPackage', async (req, res) => {
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



router.post('/updatePackage', async (req, res) => {
  const { package_name,new_name,package_overview,package_days,package_price,place, guide} = req.body;
  

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

  if (guide) {
    existingPackage.guide = guide;
  }
  
  existingPackage.save().then((result) => {
    console.log("Package saved");
  }).catch((err) => {
    console.log("failed");  
  })
  return res.send(existingPackage);
});



router.post('/deletePackage', async (req, res) => {
  const {name} = req.body;
  console.log(name);
  try {
    const ask = await Booking.find({book_pack : pack_id});
    if(ask == 0){
      const result = await Package.deleteOne({ package_name : name });
      console.log(result.deletedCount, 'document(s) deleted');
    }
    else{
      if(ask > 0){
        throw "The Package You are Trying to delete is booked by someone";
      }
    }
  } catch (error) {
    console.error('Error deleting document:', error);
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




// BOOKING PACKAGAE  //




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

router.get('/guides', async (req, res) => {
  const guides = await Guide.find({});
  console.log(guides);
  res.json(guides);
});


router.post('/updateGuide', async (req, res) => {
  const { username, newUsername, newPassword, newFirstName, newLastName, newEmail, newMobileNumber } = req.body;


  if (newUsername) {
    const existingGuideNew = await Guide.findOne({ username: newUsername });

    if (existingGuideNew) {
      return res.status(400).json({ error: "Admin with the same email or username already exists" });
    }
  }

  const existingGuide = await User.findOne({ username });

  
  if (newUsername) {
    existingGuide.username = newUsername;
  }
  if (newFirstName) {
    existingGuide.firstname = newFirstName;
  }
  if (newLastName) {
    existingGuide.lastname = newLastName;
  }
  if (newEmail) {
    existingGuide.email = newEmail;
  }
  if (newMobileNumber) {
    existingGuide.mobilenumber = newMobileNumber;
  }
  
  if (newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    existingGuide.password = hashedPassword;
  }
  existingGuide.save().then((result) => {
    console.log("Guide saved");
  }).catch((err) => {
    console.log("failed");  
  })
  return res.send(existingGuide);
});



router.post('/deleteGuide', async (req, res) => {
  const {guide} = req.body;
  console.log(guide);
  try {
    
    const result = await Guide.deleteOne({_id :  guide});

    await Package.updateMany(
      { package_guide: guide },
      { $unset: { package_guide: 1 } }
    );
    console.log(result.deletedCount, 'document(s) deleted');
  } catch (error) {
    console.error('Error deleting document:', error);
  }
});




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
