import express from "express";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import dotenv from "dotenv";
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { app, server } from "./lib/socket.js";

dotenv.config();
const PORT = process.env.PORT;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  // Define all possible locations where frontend files might be
  const possiblePaths = [
    path.join(__dirname, "..", "public"),
    path.join(__dirname, "..", "..", "frontend", "dist"),
    "/opt/render/frontend/dist",
    "/opt/render/project/backend/public"
  ];

  console.log("=== Checking for frontend files in the following locations ===");
  
  // Check each path and log its existence
  const pathChecks = possiblePaths.map(p => {
    try {
      const exists = fs.existsSync(p);
      console.log(`- ${p}: ${exists ? '✅ Found' : '❌ Not found'}`);
      if (exists) {
        console.log(`  Contents of ${p}:`);
        try {
          const files = fs.readdirSync(p);
          console.log(`  ${files.join(', ')}`);
        } catch (e) {
          console.log(`  Could not read directory: ${e.message}`);
        }
      }
      return { path: p, exists };
    } catch (err) {
      console.log(`- ${p}: ❌ Error checking path: ${err.message}`);
      return { path: p, exists: false };
    }
  });

  // Find the first existing path
  const validPath = pathChecks.find(p => p.exists);

  if (validPath) {
    const frontendPath = validPath.path;
    console.log(`\n✅ Serving static files from: ${frontendPath}\n`);
    
    // Serve static files
    app.use(express.static(frontendPath));
    
    // Handle all other routes by serving index.html
    app.get('*', (req, res) => {
      const indexPath = path.join(frontendPath, 'index.html');
      console.log(`Serving index.html from: ${indexPath}`);
      
      // Check if file exists before sending
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        console.error(`❌ index.html not found at: ${indexPath}`);
        res.status(500).send('Frontend files not found. Please check the build process.');
      }
    });
  } else {
    console.error('\n❌ Could not find frontend files in any of these locations:', possiblePaths);
    
    // Create a basic error route so we know the backend is running
    app.get('*', (req, res) => {
      res.status(500).send(`
        <h1>Backend is running, but frontend files not found</h1>
        <p>Checked the following locations:</p>
        <ul>
          ${possiblePaths.map(p => `<li>${p}</li>`).join('')}
        </ul>
        <p>Please check the build logs for more information.</p>
      `);
    });
  }
}
server.listen(PORT, () => {
  console.log("server us running on PORT:" + PORT);
  connectDB();
});
