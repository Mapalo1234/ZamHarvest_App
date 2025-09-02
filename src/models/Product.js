const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  category: String,
  province: String,
  location: String,
  organicStatus: String,
  image: String,
  sellerId: String,
  sellername: String, //added
  createdAt: {
    type: Date,
    default: Date.now
  }
});



module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);
