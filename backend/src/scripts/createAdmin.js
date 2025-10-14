const mongoose = require("mongoose");
const Admin = require("../models/admin");
require("dotenv").config();

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/ZamHarvestDB");
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: "admin@zamharvest.com" });
    if (existingAdmin) {
      console.log("Admin user already exists!");
      process.exit(0);
    }

    // Create admin user
    const admin = new Admin({
      username: "admin",
      email: "admin@zamharvest.com",
      password: "admin123", // This will be hashed by the pre-save middleware
      role: "super_admin",
      permissions: [
        "user_management",
        "product_management", 
        "order_management",
        "analytics_view",
        "settings_management",
        "content_moderation",
        "financial_reports",
        "system_configuration"
      ],
      profile: {
        firstName: "System",
        lastName: "Administrator",
        phone: "+260-000-000-000"
      }
    });

    await admin.save();
    console.log("✅ Admin user created successfully!");
    console.log("📧 Email: admin@zamharvest.com");
    console.log("🔑 Password: admin123");
    console.log("⚠️  Please change the password after first login!");
    
  } catch (error) {
    console.error(" Error creating admin user:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run the script
createAdmin();
