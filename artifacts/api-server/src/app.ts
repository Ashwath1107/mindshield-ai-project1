import express, { type Express } from "express";
import cors from "cors";
import router from "./routes";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.use("/api", router);

// Serve static frontend files from artifacts/mindshield/dist/public
const staticPath = path.resolve(__dirname, "../../mindshield/dist/public");
app.use(express.static(staticPath));

// Fallback to index.html for SPA routing
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) return; // Don't catch API calls
  res.sendFile(path.join(staticPath, "index.html"));
});

export default app;
