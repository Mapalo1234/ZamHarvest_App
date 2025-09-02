const express = require("express");
const session = require("express-session");
const path = require("path");
// const hbs = require("hbs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const dotenv = require("dotenv");
const exphbs = require("express-handlebars");
const Buyer = require("./models/buyer");
const Seller = require("./models/seller");
const Product = require("./models/Product");
const Order = require("./models/order");
const sendEmail = require("./utils/sendEmail");
const ensureSeller = require("./middleware/checkAuth");
const { error } = require("console");

const app = express();
dotenv.config();

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/ZamHarvestDB")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Session middleware
app.use(session({
  secret: "yourStrongSecretHere",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 86400000 } // 1 day
}));

// View engine
app.set("views", path.join(__dirname, "..", "templates"));
app.use(express.static(path.join(__dirname, "..", "public")));

const hbs = exphbs.create({
    extname: '.hbs',
    defaultLayout: false, 
    helpers: {
        json: function(context) {
            return JSON.stringify(context);
        }
    }
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Middleware to ensure user is a buyer
function ensureBuyer(req, res, next) {
  if (req.session.userId && req.session.role === "buyer") {
    return next();
  }
  return res.status(403).render("error", { message: "You must be logged in as a buyer to view this page." });
}

// Routes
app.get("/", (req, res) => res.redirect("/home"));
app.get("/home", (req, res) => res.render("home"));
app.get("/login", (req, res) => res.render("login"));
app.get("/signup", (req, res) => res.render("signup"));
app.get("/verified", (req, res) => res.render("verify-success"));
app.get("/add", ensureSeller, (req, res) => res.render("add"));
app.get("/listproduct", ensureBuyer, (req, res) => res.render("listproduct"));
app.get("/view", ensureSeller, (req, res) => res.render("view"));
app.get("/productDetail", (req, res) => res.render("productDetail"));
app.get("/orderTable", (req, res) => res.render("orderTable"));
app.get("/pay",(req,res) => res.render("pay"));

// Signup
app.post("/signup", async (req, res) => {
  const { username, email, password, role } = req.body;
  const verifyToken = crypto.randomBytes(32).toString("hex");

  const Model = role === "buyer" ? Buyer : role === "seller" ? Seller : null;
  if (!Model) return res.status(400).send("Invalid role");

  const exists = await Model.findOne({ email });
  if (exists) return res.status(400).send("Email already exists");

  const hashed = await bcrypt.hash(password, 10);

  await Model.create({
    username,
    email,
    password: hashed,
    role,
    verifyToken,
    isVerified: false
  });

  await sendEmail(email, verifyToken);
  res.send("Check your email to verify your account.");
});

// Verify
app.get("/verify", async (req, res) => {
  const token = req.query.token;

  const user = await Buyer.findOne({ verifyToken: token }) ||
               await Seller.findOne({ verifyToken: token });

  if (!user) return res.send("Invalid or expired token");

  user.isVerified = true;
  user.verifyToken = undefined;
  await user.save();

  res.redirect("/verified");
});

// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await Buyer.findOne({ username }) || await Seller.findOne({ username });

  if (!user) return res.send("Invalid username or password");
  if (!await bcrypt.compare(password, user.password)) return res.send("Invalid username or password");
  if (!user.isVerified) return res.send("Please verify your email first.");

  req.session.userId = user._id;
  req.session.role = user.role;
  req.session.username = user.username;

  // Pass user data to template
  res.render("home", { layout: false,  user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
});


// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// Products route
app.get("/products", async (req, res) => {
  if (!req.session.userId) return res.status(401).send("Please log in");

  const role = req.session.role;
  let products;

  if (role === "buyer") {
    products = await Product.find({}).populate("sellerId", "username"); 
  } else if (role === "seller") {
    products = await Product.find({ sellerId: req.session.userId }).populate("sellerId", "username"); 
  } else {
    return res.status(403).send("Access denied");
  }

  res.json(products);
});

app.get("/products-test", async (req, res) => {
  try {
    const products = await Product.find({}).populate("sellerId", "username");
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Create order (buyers only)
app.post("/create-order", async (req, res) => {
  try {
    const { productId, quantity, deliveryDate, totalPrice, productName, productImage, userId, userName } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: "Invalid or missing productId" });
    }

    if (!deliveryDate) {
      return res.status(400).json({ error: "Delivery date is required" });
    }

    // ✅ Fetch product to get seller details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    //  Get sellerId and sellername from product
    const sellerId = product.sellerId;
    const sellerName = product.sellername || "Unknown Seller";

    // Create order
    const order = new Order({
      orderId: `ORD-${Date.now()}`,
      buyerId: userId,
      productId,
      productName,
      image: productImage,
      totalPrice,
      deliveryDate,
      quantity,
      username: userName, // buyer name
      sellerId,
      sellerName, // ✅ now storing actual seller name
      paidStatus: "Pending"
    });

    await order.save();
    res.status(201).json({ message: "Order created successfully", order });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



app.get("/orders/:buyerId", async (req, res) => {
  try {
    const { buyerId } = req.params;

    // Optional: Validate ObjectId if you're using MongoDB ObjectId
    if (!buyerId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid buyerId" });
    }

    const orders = await Order.find({ buyerId })
      .populate("productId", "name price image")
      .exec();

    if (!orders.length) {
      return res.status(404).json({ message: "No orders found" });
    }

    res.status(200).json({ count: orders.length, orders });
  } catch (error) {
    console.error("Error fetching orders:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




// Submit product (sellers only)
app.post("/submit-product", ensureSeller, async (req, res) => {
  const product = { ...req.body, sellerId: req.session.userId };
  await Product.create(product);
  res.send("Product submitted");
});

// Delete product (sellers only)
app.delete("/product/:id", ensureSeller, async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);

  if (!product || product.sellerId.toString() !== req.session.userId) {
    return res.status(403).send("Unauthorized");
  }

  await Product.findByIdAndDelete(id);
  res.send("Deleted successfully");
});

///// delete order
app.delete("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({ message: "Order deleted successfully", deletedOrder });
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Edit product (sellers only)
app.put("/product/:id", ensureSeller, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const product = await Product.findById(id);
    if (!product || product.sellerId.toString() !== req.session.userId) {
      return res.status(403).send("Unauthorized");
    }

    await Product.findByIdAndUpdate(id, updates, { new: true });
    res.send("Product updated successfully");
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).send("Server error");
  }
});

// 404 handler
app.use((req, res) => res.status(404).send("Page not found"));

// Server start
app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on http://192.168.100.162:3000");
});
