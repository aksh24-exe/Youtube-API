import express from "express";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";
import bodyParser from "body-parser";

import { connectDB } from "./config/db.config.js";
import userRoutes from "./routes/user.routes.js";
import videoRoutes from "./routes/video.routes.js";

dotenv.config();

const app = express();
app.use(express.json()); // Middleware Setup
app.use(bodyParser.json());
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "./temp",
  })
);
const PORT = process.env.PORT || 4040;
connectDB();

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/video", videoRoutes);

app.listen(PORT, () => {
  console.log(`Server is running at https://localhost:${PORT}`);
});
