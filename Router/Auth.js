const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const userSchema = require("../Models/userSchema");
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
const bcrypt = require("bcrypt");
const packageDateSchema = require("../Models/packageDates");
const PackageDates = mongoose.model("PackageDates", packageDateSchema);
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const secretKey = "THISISMYSECURITYKEYWHICHICANTGIVEYOU";
const bodyParser = require('body-parser');
// Store files in memory as buffers
// const upload = multer({ storage: storage, limits: { fileSize: 1024 * 1024 * 10 } });  //Configuring file size which can be uploaded
const cors = require("cors");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const Razorpay = require('razorpay');
const apis = require('dotenv').config();
const crypto = require('crypto');
// USER //

router.post("/register", async (req, res) => {
  console.log("inside register");
  const { firstname, lastname, email, username, password, mobilenumber } =
    req.body;
  console.log("after destructuring");
  // Check if a user with the same email or username already exists
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  console.log("after existing user");
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  console.log("after hashing");
  if (existingUser) {
    return res
      .status(400)
      .json({ error: "User with the same email or username already exists" });
  }

  const newUser = new User({
    firstname,
    lastname,
    email,
    username,
    password: hashedPassword,
    mobilenumber,
  });

  try {
    console.log("Before");
    await newUser.save();
    const payload = {
      user: {
        id: newUser._id,
        username: newUser.username,
      },
    };
    const token = jwt.sign(payload, secretKey, { expiresIn: "1h" });
    console.log("Registration Successful!");
    res.cookie("token", token, { httpOnly: true });
    return res.status(200).json({ msg: "Registration Successful", token });
  } catch (error) {
    console.log("Registration Failed:", error);
    return res.status(401).json({ error: "Registration Failed" });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if a user with the provided username exists
    const user = await User.findOne({ username: username });
    const admin = await Admin.findOne({ username: username });
    console.log(username);
    console.log(user);
    console.log(admin);

    if (!user && !admin) {
      return res.status(401).json({ error: "Incorrect Username or Password" });
    } else if (user) {
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res
          .status(401)
          .json({ error: "Incorrect Username or Password" });
      }
      const payload = {
        user: {
          id: user._id,
          username: user.username,
        },
      };
      const token = jwt.sign(payload, secretKey, { expiresIn: "1h" });
      console.log(token);
      res.cookie("token", token, { httpOnly: true });
      return res.status(200).json({ msg: "Login Successful", token });
    } else {
      console.log("Admin");
      console.log(password);
      const passwordMatch = await Admin.findOne({ password: password });

      if (!passwordMatch) {
        return res
          .status(401)
          .json({ error: "Incorrect Username or Password" });
      }
      const payload = {
        admin: {
          id: admin._id,
          username: admin.username,
        },
      };

      const token = jwt.sign(payload, secretKey, { expiresIn: "1h" });
      console.log(token);
      res.cookie("token", token, { httpOnly: true });
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
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(403).json({ error: "Token is not valid" });
  }
}

router.post("/about", (req, res) => {
  const {token} = req.body;
  console.log(token);
  const decoded = jwt.verify(token, secretKey);
  
  return res.status(200).json({user : username});
})

// Error handling middleware
router.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

router.put("/updateUser/:id", async (req, res) => {
  const newuser = req.body;
  console.log("Update");
  console.log(newuser);
  const id = req.params.id;

  try {
    const existingUser = await User.findByIdAndUpdate(id, newuser, {
      new: true,
    });
    console.log(existingUser);
    if (!existingUser) {
      return res.status(404).json({ message: "Package not found" });
    }
    return res.json(existingUser); // Send the updated package data in response
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ message: "Failed to update user" });
  }
});

router.get("/getuser/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findOne({ _id: id }).exec();
    if (!user) {
      return res.status(404).json({ error: "Package not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/deleteUser", async (req, res) => {
  const { userid } = req.body;

  try {
    const result = await User.deleteOne({ _id: userid });
    await Comment.deleteMany({ user: userid });
    await Booking.deleteMany({ user: userid });
    console.log(result.deletedCount, "document(s) deleted");
  } catch (error) {
    console.error("Error deleting document:", error);
  }
});

router.get("/getPackageName/:id", async (req, res) => {
  console.log("inside getpackage");
  console.log(req.params.id);
  const identity = req.params.id;
  const pn = await Package.findOne({ _id : identity });
  if(pn != null)
  {
    const packName = pn.package_name;
    return res.json({packageName: packName});
  }
  return res.json({message: "Package Not Found"});
});


router.post("/bookPackage", async (req, res) => {
  try {
    const {
      package_name,
      package_overview,
      package_days,
      package_price,
      package_place,
      package_guide,
    } = req.body;

    // Find the selected places by their IDs
    const selectedPlaces = await Place.find({ _id: { $in: package_place } });

    // Create a new package with the selected places references
    const newPackage = new Package({
      package_name,
      package_overview,
      package_days,
      package_price,
      package_place: selectedPlaces.map((place) => place._id),
      package_guide,
    });

    await newPackage.save();

    res.status(201).json(newPackage);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PLACE //

router.post("/upload", upload.single("image"), async (req, res) => {
  console.log(req.body.title);
  try {
    const image = new Image({
      title: req.body.title,
      image: req.file.buffer,
    });
    await image.save();
    res.status(201).send("Image uploaded successfully");
  } catch (error) {
    res.status(500).send("Error uploading image");
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
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});

router.get("/fetchImage/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);

    const place = await Place.findOne({ _id: id });

    if (!place || !place.image) {
      return res.status(404).send("Place or Image not found");
    }

    res.contentType("image/jpeg"); // Set the content type based on your image format
    res.send(place.image.buffer); // Assuming the image data is stored in a Buffer field
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/placeDetails/:name", async (req, res) => {
  try {
    const placeName = req.params.name;
    const place = await Place.findOne({ place_name: placeName });

    if (!place) {
      return res.status(404).send("Place not found");
    }
    console.log(place.image);
    res.render("place-details", { place });
  } catch (error) {
    console.error("Error fetching place details:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/places", async (req, res) => {
  const places = await Place.find({});

  res.json(places);
});

router.get("/places/:id", async (req, res) => {
  const id = req.params.id;
  const place = await Place.findOne({ _id: id });
  res.json(place);
});

router.put("/updatePlace/:id", upload.single("image"), async (req, res) => {
  const { place_name, place_desc } = req.body;
  const id = req.params.id;

  try {
    const existingPlace = await Place.findByIdAndUpdate(
      id,
      {
        place_name,
        place_desc,
        image: {
          data: req.file.buffer, // Updated image data
          contentType: req.file.mimetype, // Updated content type
        },
      },
      { new: true }
    );

    if (!existingPlace) {
      return res.status(404).json({ message: "Place not found" });
    }

    return res.json(existingPlace);
  } catch (error) {
    console.error("Error updating place:", error);
    return res.status(500).json({ message: "Failed to update place" });
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
    res
      .status(500)
      .json({ message: "An error occurred while deleting the Place" });
  }
});

//  PACKAGE   //

router.post("/addPackage", async (req, res) => {
  try {
    const {
      package_name,
      package_overview,
      package_days,
      package_price,
      package_capacity,
      package_place,
      package_guide,
      dates, // Array of dates with start_date and end_date
    } = req.body;

    // Find the selected places by their IDs
    const selectedPlaces = await Place.find({ _id: { $in: package_place } });

    // Create a new package with the selected places references
    const newPackage = new Package({
      package_name,
      package_overview,
      package_days,
      package_price,
      package_capacity,
      package_place: selectedPlaces.map((place) => place._id),
      package_guide,
    });

    await newPackage.save();
    const pack_id = newPackage._id;

    // Create an array of PackageDates objects based on the input dates
    const packageDates = dates.map((date) => ({
      package_id: pack_id,
      start_date: date.start_date,
      end_date: date.end_date,
      rem_book: package_capacity,
    }));

    // Insert the PackageDates objects into the database
    await PackageDates.insertMany(packageDates);

    res.status(201).json(newPackage);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/packages", async (req, res) => {
  const package = await Package.find({});
  res.json(package);
});

router.get("/getpackagebypackdate/:packdateid", async (req, res) => {
  const packid = req.params.packdateid;
  const packobj = await PackageDates.findOne({_id : packid});
  console.log(packobj);
  const package = await Package.findOne({_id : packobj.package_id});
  console.log(package);
  res.json(package);
})

router.get("/packages/:id", async (req, res) => {
  console.log("inside packagees");
  console.log(req.params.id);
  const id = req.params.id;
  const package = await Package.findOne({ _id: id });
  console.log(package);
  res.json(package);
});

router.get("/getplaces/:id", async (req, res) => {
  const packageId = req.params.id;

  try {
    const package = await Package.findById(packageId).populate("package_place");

    if (!package) {
      return res.status(404).json({ message: "Package not found" });
    }

    // Extract associated places from the package document
    const associatedPlaces = package.package_place;

    res.json(associatedPlaces);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/getDates/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const dates = await PackageDates.find({ package_id: id });
    res.status(200).json(dates);
  } catch (error) {
    console.error("Error fetching dates:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/addDate/:id", async (req, res) => {
  const id = req.params.id;
  const {startDate, endDate} = req.body;
  try{
  const pack = await Package.findById({_id : id});

  const packdate = new PackageDates({
    package_id: id,
    start_date: startDate,
    end_date: endDate,
    rem_book: pack.package_capacity,
  });
  console.log(packdate);
  await packdate.save();

    res.status(201).json(packdate);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/getPackageById/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const package = await PackageDates.findOne({ _id: id }).exec();
    if (!package) {
      return res.status(404).json({ error: "Package not found" });
    }
    res.json(package);
  } catch (error) {
    console.error("Error fetching package:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/updatePackage/:id", async (req, res) => {
  const {
    package_name,
    package_overview,
    package_days,
    package_price,
    package_place,
    package_guide,
  } = req.body;
  const id = req.params.id;

  try {
    const existingPackage = await Package.findByIdAndUpdate(
      id,
      {
        package_name,
        package_overview,
        package_days,
        package_price,
        package_place,
        package_guide,
      },
      { new: true }
    );

    if (!existingPackage) {
      return res.status(404).json({ message: "Package not found" });
    }

    return res.json(existingPackage); // Send the updated package data in response
  } catch (error) {
    console.error("Error updating package:", error);
    return res.status(500).json({ message: "Failed to update package" });
  }
});

router.put("/updatepackdate/:id", async (req, res) => {
  const newobj = req.body;
  const id = req.params.id;

  try {
    const existingPackage = await PackageDates.findByIdAndUpdate(id, newobj, {
      new: true,
    });
    console.log(existingPackage);
    if (!existingPackage) {
      return res.status(404).json({ message: "Package not found" });
    }

    return res.json(existingPackage); // Send the updated package data in response
  } catch (error) {
    console.error("Error updating package:", error);
    return res.status(500).json({ message: "Failed to update package" });
  }
});

router.post("/deletePackage/:id", async (req, res) => {
  const id = req.params.id;
  console.log(id);
  try {
    const ask = await Booking.findOne({ book_pack: id });
    if (ask == null) {
      const result = await Package.deleteOne({ _id: id });
      return res.status(200).json({ message: "Package deleted" });
    } else {
      if (ask !== null) {
        return res
          .status(400)
          .json({ message: "Package is booked by someone" });
      }
    }
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});




// COMMENT  //

router.post("/addComment", async (req, res) => {
  try {
    const { newComment, userid, packid } = req.body;
    
    // Find the selected package by its ID
    const selectedPackage = await Package.findOne({ _id: packid });

    if (!selectedPackage) {
      return res.status(404).json({ error: "Package not found" });
    }

    // Create a new comment
    const newCom = new Comment({
      comment_desc: newComment,
      user: userid, // Assuming `user` is the ID of the user who posted the comment
    });

    // Save the comment
    await newCom.save();

    // Push the comment's ID into the package's comments array
    selectedPackage.package_comment.push(newCom._id);

    // Save the updated package
    await selectedPackage.save();

    res.status(201).json(newCom);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


router.get("/getComment/:id", async (req, res) => {
  try {
    const packid = req.params.id;

    const package = await Package.findById(packid);

    if (!package) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Get the comment IDs associated with the package
    const commentIds = package.package_comment;

    // Fetch the comments using the IDs
    const comments = await Comment.find({ _id: { $in: commentIds } });

    // Extract comment descriptions and usernames
    const commentData = [];

    for (const comment of comments) {
      const user = await User.findById(comment.user);
      const username = user ? user.username : 'Unknown';

      commentData.push({
        comment_desc: comment.comment_desc,
        username: username,
      });
    }

    console.log(commentData);
    res.json(commentData);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'An error occurred while fetching comments' });
  }
});

router.post("/deleteComment", async (req, res) => {
  const { comment } = req.body;
  console.log(name);
  try {
    const result = await Comment.deleteOne({ _id: comment });
    await Package.updateMany(
      { package_guide: guide },
      { $unset: { package_guide: 1 } }
    );
    console.log(result.deletedCount, "document(s) deleted");
  } catch (error) {
    console.error("Error deleting document:", error);
  }
});

// BOOKING PACKAGE  //
router.post("/bookings", async (req, res) => {
  try {
    const bookingData = req.body;
    const newBooking = new Booking(bookingData);

    const amount_to_pay = bookingData.book_cost * 100;
    var options = {
      amount: amount_to_pay,
      currency: "INR",
      receipt: "order_rcptid_11"
    };

    instance.orders.create(options, function(err, order) {
      if (err) {
        console.error("Error creating Razorpay order:", err);
        return res.status(500).json({ error: "Error creating Razorpay order" });
      }
      console.log(order);
    });

    const savedBooking = await newBooking.save();
    res.status(201).json(savedBooking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: "An error occurred while creating the booking" });
  }
});

router.post("/bookSelectedPackage", async (req, res) => {
  const package_name = req.body.package_name;
  const pack = await Package.findOne({ package_name: package_name });

  console.log(pack);
  return res.json({ message: `Selected ${package_name}` });
});

router.get("/getbook/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const result = await Booking.find({ book_user: id });
    if (!result) {
      return res.status(404).json({ error: "bookings not found" });
    }
    res.json(result);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.get('/getcurrbook/:userid', async (req, res) => {
  try {
    const currentDate = new Date();
    const userId = req.params.userid;

    // Assuming you have the necessary Mongoose models and schemas defined

    const bookings = await Booking.find({
      book_user: userId,
    }).populate({
      path: 'book_pack',
      model: 'PackageDateSchema',
      match: {
        end_date: { $gt: currentDate },
      },
    });
    console.log("Hello");
    console.log(bookings);
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




router.post("/deleteBooking", async (req, res) => {
  const { user } = req.body;
  console.log(user);
  try {
    const result = await Booking.deleteOne({ _id: user });
    console.log(result.deletedCount, "document(s) deleted");
  } catch (error) {
    console.error("Error deleting document:", error);
  }
});

//   ADMIN   //

router.post("/updateAdmin", async (req, res) => {
  const {
    username,
    newUsername,
    newPassword,
    newFirstName,
    newLastName,
    newEmail,
    newMobileNumber,
  } = req.body;

  if (newUsername) {
    const existingAdminNew = await Admin.findOne({ username: newUsername });

    if (existingAdminNew) {
      return res
        .status(400)
        .json({
          error: "Admin with the same email or username already exists",
        });
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
  existingAdmin
    .save()
    .then((result) => {
      console.log("Admin saved");
    })
    .catch((err) => {
      console.log("failed");
    });
  return res.send(existingAdmin);
});

router.post("/deleteAdmin", async (req, res) => {
  const { admin } = req.body;
  console.log(user);
  try {
    const result = await Admin.deleteOne({ _id: admin });
    console.log(result.deletedCount, "document(s) deleted");
  } catch (error) {
    console.error("Error deleting document:", error);
  }
});

// GUIDE

router.post("/addGuide", async (req, res) => {
  const { firstname, lastname, email, username, password, mobilenumber } =
    req.body;

  // Check if a user with the same email or username already exists
  const existingGuide = await Guide.findOne({ $or: [{ email }, { username }] });

  const hashedPassword = await bcrypt.hash(password, saltRounds);

  if (existingGuide) {
    return res
      .status(400)
      .json({ error: "Guide with the same email or username already exists" });
  }

  // If user doesn't exist, create a new user and save
  const newGuide = new Guide({
    firstname,
    lastname,
    email,
    username,
    password: hashedPassword,
    mobilenumber,
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

router.get("/guideUsernames", async (req, res) => {
  try {
    // Find all guides and project only the 'username' field
    const guides = await Guide.find({}, "username");

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

router.get("/guide/:id", async (req, res) => {
  const id = req.params.id;
  console.log(id);
  const guide = await Guide.findOne({ _id: id });
  res.json(guide);
});

router.get("/guides", async (req, res) => {
  const guides = await Guide.find({});
  res.json(guides);
});

router.put("/updateGuide/:id", async (req, res) => {
  const { firstname, lastname, email, username, mobilenumber } = req.body;
  const id = req.params.id;

  try {
    const existingGuide = await Guide.findByIdAndUpdate(
      id,
      {
        firstname,
        lastname,
        email,
        username,
        mobilenumber,
      },
      { new: true }
    );

    if (!existingGuide) {
      return res.status(404).json({ message: "Guide not found" });
    }

    return res.json(existingGuide); // Send the updated package data in response
  } catch (error) {
    console.error("Error updating Guide:", error);
    return res.status(500).json({ message: "Failed to update Guide" });
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
    res
      .status(500)
      .json({ message: "An error occurred while deleting the Guide" });
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

router.post("/addAnnouncement", async (req, res) => {
  try {
    const { announcement_desc, bpack } = req.body;

    // Find the selected places by their IDs
    const selectedPack = await Package.find({ bpack });

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

router.post("/getAnnouncement", async (req, res) => {
  const { userid } = req.body;

  const selectedPack = await Package.find({ book_user: userid });

  const announcement = await Announcement.find({ Booking: selectedPack._id });

  res.render("Announcemet-details", { announcement });
});

router.post("/order", async (req, res) =>{

  const bookingData = req.body;
  console.log("Booking data : " + bookingData);

  const amount_to_pay = bookingData.book_cost;
  try{
    const instance = new Razorpay({ key_id: process.env.API_KEY,
       key_secret: process.env.API_SECRET_KEY});
       const options = {
        amount : amount_to_pay * 100,
        currency : "INR",
        receipt : crypto.randomBytes(10).toString("hex"),
       };

       instance.orders.create(options, async (error, order) => {
        console.log("inside create order");
        if(error)
        {
          console.log(error);
          return res.status(500).json({"message" : "Something Went Wrong"});
        }
        console.log("passed from order");
        console.log("Saved Booking from auth.js ", bookingData);
        res.status(200).json({data : order, savedBooking : bookingData});
       });
  }
  catch(error)
  {
    console.log(error);
    return res.status(500).json({message : "Internal Server Error"});
  }
});

router.post("/verify", async (req, res) => {
  console.log("inside verify of auth");
  try{
    const { response, bookingData } = req.body;
    const { razorpay_order_id, razorpay_payment_id,  razorpay_signature } = response;
    
    console.log("Booking data from verify " + bookingData.book_cost);
    console.log("api key " , process.env.API_KEY);
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedsign = crypto.createHmac("sha256", process.env.API_SECRET_KEY)
    .update(sign).digest("hex");
    
    console.log("signature ", razorpay_signature);
    console.log("Expected sign ", expectedsign);

    if(razorpay_signature === expectedsign) {
      console.log("inside if");
      const saveBooking = new Booking(bookingData);
      saveBooking.save();
      return res.status(200).json({message : "Payment verified successfully"});
    }
  }
  catch(error)
  {
    console.log(error);
    res.status(500).json({message : "Internal Server Error!"});
  }
});

module.exports = router;
