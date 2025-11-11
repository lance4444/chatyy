import express from "express";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import dotenv from "dotenv";
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { app, server } from "./lib/socket.js";

dotenv.config();
const PORT = process.env.PORT;
const __dirname = path.resolve();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// In production, serve static files from the frontend/dist directory
if (process.env.NODE_ENV === "production") {
  // Try multiple possible locations for the frontend files
  const possiblePaths = [
    path.join(__dirname, "..", "public"),       // For new build location
    path.join(__dirname, "..", "..", "frontend", "dist"),  // Old location
    "/opt/render/frontend/dist"                  // Render's expected location
  ];

  // Find the first path that exists
  const frontendPath = possiblePaths.find(p => {
    try {
      return fs.existsSync(p);
    } catch (err) {
      return false;
    }
  });

  if (frontendPath) {
    console.log("Serving static files from:", frontendPath);
    app.use(express.static(frontendPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(frontendPath, "index.html"));
    });
  } else {
    console.error("Could not find frontend files in any of these locations:", possiblePaths);
  }
}
server.listen(PORT, () => {
  console.log("server us running on PORT:" + PORT);
  connectDB();
});
