const mongoose = require("mongoose");

mongoose.connect("mongodb://192.168.8.100:27017/ZamHarvestDB")

  .then(() => {
    console.log("mongodb connected");
  })
  .catch(() => {
    console.log("failed to connect");
  });

  

