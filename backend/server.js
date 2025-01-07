import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";

import session from "express-session";
import passport from "./config/passport.js";
import { checkPassportState } from "./config/passport.js";

import { connectDB } from "./config/db.js";
import MongoStore from "connect-mongo";

import userRoute from "./routes/userRoute.js";
import projectRoute from "./routes/projectRoute.js";
import uploadsRoute from "./routes/uploadsRoute.js";
import submissionRoute from "./routes/submissionRoute.js";
import gradeRoute from "./routes/gradeRoute.js";
import gradeStructureRoute from "./routes/gradeStructureRoute.js";
import randomRoute from "./routes/randomRoute.js";
import configRoute from "./routes/configRoute.js";
import Config from "./models/config.js";

// Load environment variables and allows to use .env file
dotenv.config();

const app = express();
const server_port = process.env.SERVER_PORT || 3000;

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.originalUrl}`);
  res.header("Access-Control-Allow-Origin", `${process.env.CORS_ORIGIN}`);
  res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
  next();
});

// Allow cross-origin requests
const corsOptions = {
  origin: process.env.CORS_ORIGIN, // Allow all origins for Development purposes only
  credentials: true, // Allow cookies and credentials
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  optionsSuccessStatus: 204, // Add this
};

// Apply CORS globally
app.use(cors(corsOptions));

// Update your MongoDB session store configuration
const sessionStore = MongoStore.create({
  mongoUrl: process.env.NODE_ENV === "production" ? process.env.MONGO_URI : process.env.MONGO_URI_LOCAL,
  collectionName: "sessions",
  ttl: 24 * 60 * 60, // Time to live - 1 day
  autoRemove: "native",
  stringify: false,
});

// Add session store error handling
sessionStore.on("error", function (error) {
  console.error("Session Store Error:", error);
});

app.use(
  session({
    secret: process.env.SESSION_SECRET, // Set a strong secret in .env file
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    name: "sessionId",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // Cookie will expire after 1 day
      secure: process.env.NODE_ENV === "production", // Set to true if using HTTPS
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // Use Lax for local development
      httpOnly: false, // This prevents JavaScript access
      // domain: process.env.NODE_ENV === "production" ? new URL(process.env.CORS_ORIGIN).hostname : undefined,
    },
  }),
);

app.use((req, res, next) => {
  console.log("Request Debug:", {
    host: req.get("host"),
    origin: req.get("origin"),
    protocol: req.protocol,
    secure: req.secure,
    xForwardedProto: req.get("x-forwarded-proto"),
    cookies: req.cookies,
    sessionID: req.sessionID,
  });
  next();
});

app.use(passport.initialize());
app.use(passport.session());
app.use(checkPassportState);

// Parse incoming request bodies in a middleware before your handlers, available under the req.body property.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Middleware to parse URL-encoded bodies

app.use("/api/user", userRoute);
app.use("/api/project", projectRoute);
app.use("/api/submission", submissionRoute);
app.use("/api/grade", gradeRoute);
app.use("/api/grade-structure", gradeStructureRoute);
app.use("/api/uploads", uploadsRoute);
app.use("/api/random", randomRoute);
app.use("/api/config", configRoute);
app.use("/uploads", express.static("uploads")); // Serve uploaded files

app.get("/", (req, res) => {
  res.send("Hello World! Nothing to see here yet!");
});

app.use((err, req, res, next) => {
  console.error("Error:", err.stack || err.message);
  res.status(500).json({ error: "Internal Server Error" });
});

async function initializeConfig() {
  try {
    const config = await Config.findOne();
    if (!config) {
      await Config.create({});
      console.log("Default configuration created");
    } else {
      console.log("Configuration file loaded");
    }
  } catch (error) {
    console.error("Error initializing configuration:", error);
  }
}

app.listen(server_port, () => {
  // awaiting for mongoDB connection before initializing config
  connectDB().then(() => {
    initializeConfig();
  });
  console.log(`Server is running at port: ${server_port}`);
});
