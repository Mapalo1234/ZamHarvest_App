const express = require("express");
const session = require("express-session");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const exphbs = require("express-handlebars");

// Import routes
const { router: authRoutes, ensureBuyer } = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const requestRoutes = require("./routes/requestRoutes");

// Load environment variables
dotenv.config();

const app = express();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/ZamHarvestDB")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || "yourStrongSecretHere",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 86400000 } // 1 day
}));

// View engine setup
app.set("views", path.join(__dirname, "..", "..", "frontend", "templates"));
app.use(express.static(path.join(__dirname, "..", "..", "frontend", "public")));

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

// Routes
app.get("/", (req, res) => res.redirect("/home"));
app.get("/home", (req, res) => res.render("home"));
app.get("/login", (req, res) => res.render("login"));
app.get("/signup", (req, res) => res.render("signup"));
app.get("/verified", (req, res) => res.render("verify-success"));
app.get("/add", require("./middleware/checkAuth"), (req, res) => res.render("add"));
app.get("/listproduct", ensureBuyer, (req, res) => res.render("listproduct"));
app.get("/view", require("./middleware/checkAuth"), (req, res) => res.render("view"));
app.get("/productDetail", (req, res) => res.render("productDetail"));
app.get("/orderTable", (req, res) => res.render("orderTable"));
app.get("/pay", (req, res) => res.render("pay"));
app.get("/request", (req, res) => res.render("request"));


// API Routes
app.use("/", authRoutes);
app.use("/", productRoutes);
app.use("/", orderRoutes);
app.use("/", paymentRoutes);
app.use("/requests", requestRoutes);

// 404 handler
app.use((req, res) => res.status(404).send("Page not found"));

module.exports = app;
