// api/index.js
const app = require("../server");
const connectDB = require("../config/db");

// This ensures the DB is connected for every serverless execution
const handler = async (req, res) => {
  await connectDB();
  return app(req, res);
};

module.exports = handler;
