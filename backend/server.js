import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";

import session from "express-session";
import passport from "./config/passport.js";

import { connectDB } from "./config/db.js";
import MongoStore from "connect-mongo";

import userRoute from "./routes/userRoute.js";
import projectRoute from "./routes/projectRoute.js";
import templateFilesRoute from "./routes/templateFilesRoute.js";

// Load environment variables and allows to use .env file
dotenv.config();

const app = express();
const server_port = process.env.SERVER_PORT || 3000;

app.use(
  session({
    secret: process.env.SESSION_SECRET, // Set a strong secret in .env
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI, collectionName: "sessions" }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // Cookie will expire after 1 day
      secure: false, // Set to true if using HTTPS
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Allow cross-origin requests
const corsOptions = {
  origin: true, // Allow all origins for Development purposes only
  credentials: true, // Allow cookies and credentials
};

app.use(cors(corsOptions));

// Parse incoming request bodies in a middleware before your handlers, available under the req.body property.
app.use(bodyParser.json());

app.use("/api/user", userRoute);
app.use("/api/project", projectRoute);
app.use("/api/file-templates", templateFilesRoute);
app.use("/templateFiles", express.static("templateFiles"));

app.get("/", (req, res) => {
  res.send("Hello World! Nothing to see here yet!");
});

app.listen(server_port, () => {
  connectDB();
  console.log(`Server is running at http://localhost:${server_port}`);
});
