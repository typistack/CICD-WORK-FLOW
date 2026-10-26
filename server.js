const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Sample In-Memory User Data ──────────────────────────────────────────────
const users = [
  { id: 1, name: "Aarav Shah",    email: "aarav@example.com",  age: 25, role: "Admin"  },
  { id: 2, name: "Priya Patel",   email: "priya@example.com",  age: 30, role: "User"   },
  { id: 3, name: "Rohan Mehta",   email: "rohan@example.com",  age: 22, role: "User"   },
  { id: 4, name: "Sneha Joshi",   email: "sneha@example.com",  age: 28, role: "Editor" },
  { id: 5, name: "Kiran Sharma",  email: "kiran@example.com",  age: 35, role: "User"   },
];

// ─── Helper: JSON response ────────────────────────────────────────────────────
const sendJSON = (res, status, message, data = null) => {
  const response = {
    success: status >= 200 && status < 300,
    status,
    message,
    timestamp: new Date().toISOString(),
    ...(data !== null && { data }),
  };
  return res.status(status).json(response);
};

// ═════════════════════════════════════════════════════════════════════════════
//  ROUTES
// ═════════════════════════════════════════════════════════════════════════════

// ── 1. Home / Welcome ────────────────────────────────────────────────────────
// GET /
app.get("/", (req, res) => {
  sendJSON(res, 200, "🚀 im git  Server is running! Welcome to Simple Node.js API", {
    version: "1.0.0",
    endpoints: {
      home:           "GET  /",
      serverStatus:   "GET  /status",
      getAllUsers:     "GET  /api/users",
      getUserById:    "GET  /api/users/:id",
      searchUsers:    "GET  /api/users/search?name=...&role=...",
      createUser:     "POST /api/users",
      openUrl:        "GET  /open-url?url=https://example.com",
      customMsg:      "GET  /message?msg=Hello+World",
    },
  });
});

// ── 2. Server Status ─────────────────────────────────────────────────────────
// GET /status
app.get("/status", (req, res) => {
  sendJSON(res, 200, "Server is healthy ✅", {
    uptime:     `${Math.floor(process.uptime())}s`,
    memory:     `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
    nodeVersion: process.version,
    platform:   process.platform,
    pid:        process.pid,
  });
});

// ── 3. Get All Users ─────────────────────────────────────────────────────────
// GET /api/users
app.get("/api/users", (req, res) => {
  sendJSON(res, 200, `Found ${users.length} users`, {
    count: users.length,
    users,
  });
});

// ── 4. Search Users ──────────────────────────────────────────────────────────
// GET /api/users/search?name=Priya&role=Admin
app.get("/api/users/search", (req, res) => {
  const { name, role } = req.query;

  let results = [...users];
  if (name) results = results.filter(u => u.name.toLowerCase().includes(name.toLowerCase()));
  if (role) results = results.filter(u => u.role.toLowerCase() === role.toLowerCase());

  if (results.length === 0) {
    return sendJSON(res, 404, "No users found matching your search", { query: req.query });
  }
  sendJSON(res, 200, `Found ${results.length} matching user(s)`, {
    query:   req.query,
    count:   results.length,
    results,
  });
});

// ── 5. Get Single User by ID ─────────────────────────────────────────────────
// GET /api/users/:id
app.get("/api/users/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const user = users.find(u => u.id === id);

  if (!user) {
    return sendJSON(res, 404, `User with id ${id} not found ❌`);
  }
  sendJSON(res, 200, `User found ✅`, user);
});

// ── 6. Create New User ───────────────────────────────────────────────────────
// POST /api/users
// Body: { "name": "...", "email": "...", "age": 0, "role": "..." }
app.post("/api/users", (req, res) => {
  const { name, email, age, role } = req.body;

  if (!name || !email) {
    return sendJSON(res, 400, "name and email are required fields ❌");
  }

  const newUser = {
    id:    users.length + 1,
    name,
    email,
    age:   age  || 0,
    role:  role || "User",
  };

  users.push(newUser);
  sendJSON(res, 201, `User "${name}" created successfully 🎉`, newUser);
});

// ── 7. Open URL – return URL info as JSON ────────────────────────────────────
// GET /open-url?url=https://www.google.com
app.get("/open-url", (req, res) => {
  const { url } = req.query;

  if (!url) {
    return sendJSON(res, 400, "Please provide a url query parameter ❌", {
      example: "/open-url?url=https://www.google.com",
    });
  }

  // Validate URL format
  try {
    const parsed = new URL(url);
    sendJSON(res, 200, "URL received and processed ✅", {
      originalUrl: url,
      protocol:    parsed.protocol,
      hostname:    parsed.hostname,
      pathname:    parsed.pathname,
      fullUrl:     parsed.href,
      note:        "In a desktop app you can open this with: require('open')(url)",
    });
  } catch {
    sendJSON(res, 400, "Invalid URL format ❌", { providedUrl: url });
  }
});

// ── 8. Custom Message Endpoint ───────────────────────────────────────────────
// GET /message?msg=Hello+World
app.get("/message", (req, res) => {
  const { msg } = req.query;

  if (!msg) {
    return sendJSON(res, 400, "Please provide a msg query parameter ❌", {
      example: "/message?msg=Hello+World",
    });
  }

  sendJSON(res, 200, "Message received 📩", {
    yourMessage: msg,
    length:      msg.length,
    upperCase:   msg.toUpperCase(),
    lowerCase:   msg.toLowerCase(),
    reversed:    msg.split("").reverse().join(""),
    wordCount:   msg.trim().split(/\s+/).length,
  });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  sendJSON(res, 404, `Route "${req.method} ${req.originalUrl}" not found ❌`, {
    availableRoutes: [
      "GET  /",
      "GET  /status",
      "GET  /api/users",
      "GET  /api/users/:id",
      "GET  /api/users/search?name=...&role=...",
      "POST /api/users",
      "GET  /open-url?url=https://example.com",
      "GET  /message?msg=Hello+World",
    ],
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log(`║  🚀  Server running at http://localhost:${PORT}║`);
  console.log("╠══════════════════════════════════════════════╣");
  console.log("║  📋  Available API Endpoints:                ║");
  console.log("║                                              ║");
  console.log("║  GET  /                    → Home / Welcome  ║");
  console.log("║  GET  /status              → Server Status   ║");
  console.log("║  GET  /api/users           → All Users       ║");
  console.log("║  GET  /api/users/:id       → User by ID      ║");
  console.log("║  GET  /api/users/search    → Search Users    ║");
  console.log("║  POST /api/users           → Create User     ║");
  console.log("║  GET  /open-url?url=...    → Process URL     ║");
  console.log("║  GET  /message?msg=...     → Echo Message    ║");
  console.log("╚══════════════════════════════════════════════╝\n");
});
