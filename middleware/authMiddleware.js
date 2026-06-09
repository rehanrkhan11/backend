// middleware/authMiddleware.js
// ─────────────────────────────────────────────────────────────
// JWT-based authentication and role-based authorization middleware
// ─────────────────────────────────────────────────────────────

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ── Protect routes: verify JWT ──────────────────────────────
const protect = async (req, res, next) => {
  let token;

  // Check for Bearer token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      // TODO: Add token blacklisting for logout (use Redis or DB-stored revoked tokens)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request (without password)
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User not found, token invalid" });
      }

      next();
    } catch (error) {
      console.error("Token verification failed:", error.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }
};

// ── Role guard: restrict to specific roles ──────────────────
// Usage: authorize("doctor") or authorize("patient", "doctor")
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Role '${req.user.role}' is not allowed here.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
