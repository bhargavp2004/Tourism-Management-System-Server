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
const bcrypt = require("bcrypt");
const packageDateSchema = require("../Models/packageDates");
const PackageDates = mongoose.model("PackageDates", packageDateSchema);
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const secretKey = "THISISMYSECURITYKEYWHICHICANTGIVEYOU";
const bodyParser = require('body-parser');
const cors = require("cors");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const Razorpay = require('razorpay');
const apis = require('dotenv').config();
const crypto = require('crypto');

router.post("/register", async (req, res) => {
  
  const { firstname, lastname, email, username, password, mobilenumber } = req.body;
  
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  
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
    
    await newUser.save();
    const payload = {
      user: {
        id: newUser._id,
        username: newUser.username,
      },
    };
    const token = jwt.sign(payload, secretKey, { expiresIn: "1h" });
    
    res.cookie("token", token, { httpOnly: true });
    return res.status(200).json({ msg: "Registration Successful", token });
  } catch (error) {
    
    return res.status(401).json({ error: "Registration Failed" });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username: username });
    const admin = await Admin.findOne({ username: username });
    

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
      
      res.cookie("token", token, { httpOnly: true });
      return res.status(200).json({ msg: "Login Successful", token });
    } else {
      
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
      
      res.cookie("token", token, { httpOnly: true });
      
      return res.status(201).json({ msg: "Login Successful", token });
    }
  } catch (error) {
    
    return res.status(401).json({ error: "Login Failed" });
  }
});

router.post("/about", (req, res) => {
  const { token } = req.body;
  
  const decoded = jwt.verify(token, secretKey);

  return res.status(200).json({ user: username });
})


router.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

router.put("/updateUser/:id", async (req, res) => {
  const newuser = req.body;
  
  const id = req.params.id;

  try {
    const existingUser = await User.findByIdAndUpdate(id, newuser, {
      new: true,
    });
    
    if (!existingUser) {
      return res.status(404).json({ message: "Package not found" });
    }
    return res.json(existingUser);
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

  } catch (error) {
    console.error("Error deleting document:", error);
  }
});

router.get("/getPackageName/:id", async (req, res) => {
  
  const identity = req.params.id;
  const pn = await Package.findOne({ _id: identity });
  if (pn != null) {
    const packName = pn.package_name;
    return res.json({ packageName: packName });
  }
  return res.json({ message: "Package Not Found" });
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
    const selectedPlaces = await Place.find({ _id: { $in: package_place } });
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
    const place = await Place.findOne({ _id: id });

    if (!place || !place.image) {
      return res.status(404).send("Place or Image not found");
    }

    const imageBase64 = place.image.data.toString("base64");
    const imageResponse = {
      image: imageBase64,
      contentType: place.image.contentType,
    };

    res.json(imageResponse);
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
    
    res.render("place-details", { place });
  } catch (error) {
    console.error("Error fetching place details:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/places", async (req, res) => {
  try {
    const places = await Place.find();

    const placesWithBase64Images = places.map(place => {
      return {
        place_id: place._id,
        place_name: place.place_name,
        place_desc: place.place_desc,
        title: place.title,
        image: place.image.data.toString('base64'),
        contentType: place.image.contentType
      };
    });

    res.json(placesWithBase64Images);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }

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
          data: req.file.buffer,
          contentType: req.file.mimetype,
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

    const place = await Place.findById(id);

    if (!place) {
      return res.status(404).json({ message: "Place not found" });
    }

    

    await Place.deleteOne({ _id: id });
    return res.status(200).json({ message: "Successfully deleted" });
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
      start_date,
      end_date,
      img_url
    } = req.body;

    const selectedPlaces = await Place.find({ _id: { $in: package_place } });
    const newPackage = new Package({
      package_name,
      package_overview,
      package_days,
      package_price,
      package_capacity,
      package_place: selectedPlaces.map((place) => place._id),
      package_guide,
      img_url
    });
    
    await newPackage.save();
    const pack_id = newPackage._id;
    const packageDates =
    {
      package_id: pack_id,
      start_date: start_date,
      end_date: end_date,
      rem_book: package_capacity,
    }
    await PackageDates.create(packageDates); 

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
  const packobj = await PackageDates.findOne({ _id: packid });
  
  const package = await Package.findOne({ _id: packobj.package_id });
 
  res.json(package);
})

router.get("/packages/:id", async (req, res) => {
  
  const id = req.params.id;
  const package = await Package.findOne({ _id: id });
  
  res.json(package);
});

router.get("/getplaces/:id", async (req, res) => {
  const packageId = req.params.id;

  try {
    const package = await Package.findById(packageId).populate("package_place");

    if (!package) {
      return res.status(404).json({ message: "Package not found" });
    }

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
  const { startDate, endDate } = req.body;
  try {
    const pack = await Package.findById({ _id: id });

    const packdate = new PackageDates({
      package_id: id,
      start_date: startDate,
      end_date: endDate,
      rem_book: pack.package_capacity,
    });
    
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

    return res.json(existingPackage);
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
    
    if (!existingPackage) {
      return res.status(404).json({ message: "Package not found" });
    }

    return res.json(existingPackage);
  } catch (error) {
    console.error("Error updating package:", error);
    return res.status(500).json({ message: "Failed to update package" });
  }
});

router.post("/deletePackage/:id", async (req, res) => {
  const id = req.params.id;
  
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
    const selectedPackage = await Package.findOne({ _id: packid });

    if (!selectedPackage) {
      return res.status(404).json({ error: "Package not found" });
    }
    const newCom = new Comment({
      comment_desc: newComment,
      user: userid, 
    });
    await newCom.save();

    selectedPackage.package_comment.push(newCom._id);
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

    const commentIds = package.package_comment;
    const comments = await Comment.find({ _id: { $in: commentIds } });
    const commentData = await Promise.all(
      comments.map(async (comment) => {
        const user = await User.findById(comment.user);
        return {
          comment_desc: comment.comment_desc,
          username: user ? user.username : "Unknown User",
        };
      })
    );

    res.json(commentData);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'An error occurred while fetching comments' });
  }
});



router.post("/deleteComment", async (req, res) => {
  const { comment } = req.body;
  
  try {
    const result = await Comment.deleteOne({ _id: comment });
    await Package.updateMany(
      { package_guide: guide },
      { $unset: { package_guide: 1 } }
    );
    
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

    instance.orders.create(options, function (err, order) {
      if (err) {
        console.error("Error creating Razorpay order:", err);
        return res.status(500).json({ error: "Error creating Razorpay order" });
      }
      
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

    const bookings = await Booking.find({
      book_user: userId,
    });

    const filteredBookings = await Promise.all(
      bookings.map(async (book) => {
        const pack = await PackageDates.findById(book.book_pack);
        if(pack.end_date > currentDate){
          return book;
        }
      })
    );
    
    res.json(filteredBookings || []); 
      
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});





router.delete("/cancelBooking/:bookingId", async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const canceledBooking = await Booking.findByIdAndRemove(bookingId);

    if (!canceledBooking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.status(200).json({ message: "Booking canceled successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
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
      
    })
    .catch((err) => {
      
    });
  return res.send(existingAdmin);
});

router.post("/deleteAdmin", async (req, res) => {
  const { admin } = req.body;
 
  try {
    const result = await Admin.deleteOne({ _id: admin });
    
  } catch (error) {
    console.error("Error deleting document:", error);
  }
});

// GUIDE

router.post("/addGuide", async (req, res) => {
  const { firstname, lastname, email, username, password, mobilenumber } =
    req.body;
  const existingGuide = await Guide.findOne({ $or: [{ email }, { username }] });

  const hashedPassword = await bcrypt.hash(password, saltRounds);

  if (existingGuide) {
    return res
      .status(400)
      .json({ error: "Guide with the same email or username already exists" });
  }
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
    
    return res.status(201).json({ msg: "Registration Successful" });
  } catch (error) {
    
    return res.status(500).json({ error: "Registration Failed" });
  }
});

router.get("/guideUsernames", async (req, res) => {
  try {
    const guides = await Guide.find({}, "username");
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

    return res.json(existingGuide); 
  } catch (error) {
    console.error("Error updating Guide:", error);
    return res.status(500).json({ message: "Failed to update Guide" });
  }
});

router.post("/deleteGuide/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const guide = await Guide.findById(id);

    if (!guide) {
      return res.status(404).json({ message: "Guide not found" });
    }

    await Guide.deleteOne({ _id: id });
  } catch (error) {
    console.error("Error deleting Guide:", error);
    res
      .status(500)
      .json({ message: "An error occurred while deleting the Guide" });
  }
});

// Announcement //

router.post("/addAnnouncement", async (req, res) => {
  try {
    const { announcement_desc, bpack } = req.body;
    const selectedPack = await Package.find({ bpack });

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

router.post("/order", async (req, res) => {

  const bookingData = req.body;
  

  const amount_to_pay = bookingData.book_cost;
  try {
    const instance = new Razorpay({
      key_id: process.env.API_KEY,
      key_secret: process.env.API_SECRET_KEY
    });
    const options = {
      amount: amount_to_pay * 100,
      currency: "INR",
      receipt: crypto.randomBytes(10).toString("hex"),
    };

    instance.orders.create(options, async (error, order) => {
      
      if (error) {
        
        return res.status(500).json({ "message": "Something Went Wrong" });
      }
      
      res.status(200).json({ data: order, savedBooking: bookingData });
    });
  }
  catch (error) {
    
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/verify", async (req, res) => {
  
  try {
    const { response, bookingData } = req.body;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = response;

   
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedsign = crypto.createHmac("sha256", process.env.API_SECRET_KEY)
      .update(sign).digest("hex");

    

    if (razorpay_signature === expectedsign) {
      
      const saveBooking = new Booking(bookingData);
      saveBooking.save();
      return res.status(200).json({ message: "Payment verified successfully" });
    }
  }
  catch (error) {
    
    res.status(500).json({ message: "Internal Server Error!" });
  }
});

module.exports = router;