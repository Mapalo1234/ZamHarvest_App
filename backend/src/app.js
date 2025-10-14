const express = require("express");
const session = require("express-session");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const exphbs = require("express-handlebars");
const { securityConfig, additionalSecurity, sanitizeRequest } = require("./middleware/security");
const { ErrorHandler } = require("./utils/ErrorHandler");
const Logger = require("./utils/Logger");
const requestLogger = require("./middleware/requestLogger");

// Import routes
const { router: authRoutes, ensureBuyer } = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const requestRoutes = require("./routes/requestRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const adminRoutes = require("./routes/adminRoutes");
const healthRoutes = require("./routes/healthRoutes");

// Load environment variables
dotenv.config();

const app = express();

// Initialize error handling
ErrorHandler.init();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/ZamHarvestDB")
  .then(() => {
    Logger.info("MongoDB connected successfully", {
      uri: process.env.MONGODB_URI ? "configured" : "default"
    });
  })
  .catch(err => {
    Logger.error("MongoDB connection failed", err, {
      uri: process.env.MONGODB_URI || "mongodb://localhost:27017/ZamHarvestDB"
    });
  });

// Request logging middleware
app.use(requestLogger);

// Security middleware
app.use(securityConfig);
app.use(additionalSecurity);
app.use(sanitizeRequest);

// Rate limiting removed - was causing module not found errors

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || "yourStrongSecretHere",
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 86400000, // 1 day
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  }
}));

// View engine setup
app.set("views", path.join(__dirname, "..", "..", "frontend", "templates"));
app.use(express.static(path.join(__dirname, "..", "..", "frontend", "public")));

const hbs = exphbs.create({
    extname: '.hbs',
    defaultLayout: false,
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
    },
    helpers: {
        json: function(context) {
            return JSON.stringify(context);
        },
        eq: function(a, b) {
            return a === b;
        },
        formatDate: function(date) {
            if (!date) return 'N/A';
            const d = new Date(date);
            return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
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
app.get("/notification", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  res.render("notification");
});
app.get("/productDetail", (req, res) => res.render("productDetail"));
app.get("/orderTable", (req, res) => res.render("orderTable"));
app.get("/pay", (req, res) => res.render("pay"));
app.get("/request", require("./middleware/checkAuth"), (req, res) => res.render("request"));
app.get("/messaging", require("./middleware/ensureAuth"), (req, res) => res.render("messaging"));

// Admin Routes (must be before regular auth routes)
app.use("/admin", adminRoutes);

// Legacy Routes (mounted at root)
app.use("/", authRoutes);
app.use("/", productRoutes);
app.use("/", orderRoutes);
app.use("/", paymentRoutes);
app.use("/", messageRoutes); // Legacy message routes
app.use("/requests", requestRoutes);

// Health check routes (no rate limiting)
app.use("/api/health", healthRoutes);

// API Routes (mounted at /api)
app.use("/api", notificationRoutes);
app.use("/api", messageRoutes); // API message routes
app.use("/api", reviewRoutes);
app.use("/api", receiptRoutes);

// Rate limiting removed - was causing module not found errors

// Debug: Log all registered routes
console.log('Registered API routes:');
reviewRoutes.stack.forEach((route) => {
  if (route.route) {
    const methods = Object.keys(route.route.methods).join(', ').toUpperCase();
    console.log(`  ${methods} /api${route.route.path}`);
  }
});

// 404 handler
app.use((req, res) => {
  Logger.warn("404 - Page not found", {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });
  res.status(404).send("Page not found");
});

// Global error handler (must be last)
app.use(ErrorHandler.handle.bind(ErrorHandler));

module.exports = app;
