const mongoose = require("mongoose");

// Create a variable to cache the connection
let isConnected = false; 

const connectDB = async () => {
  mongoose.set("strictQuery", true);

  if (isConnected) {
    console.log("=> Using existing database connection");
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGO_URI);

    isConnected = db.connections[0].readyState;
    console.log(`✅ MongoDB Connected: ${db.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    // In serverless, we usually don't want to process.exit(1) 
    // as it kills the function instance entirely.
    throw error; 
  }
};

module.exports = connectDB;
