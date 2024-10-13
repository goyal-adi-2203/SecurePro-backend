import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/AuthRoutes.js";
import userRoutes from "./routes/UserRoutes.js";
// import admin from "./config/firebaseConfig.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const databaseUrl = process.env.DATABASE_URL;

app.use(
	cors({
		origin: process.env.ORIGIN,
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
		credentials: true,
	})
);

app.use("/uploads", express.static("uploads"));
app.use("/uploads/profiles", express.static("uploads/profiles"));
app.use("/uploads/files", express.static("uploads/files"));

app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

const server = app.listen(PORT, async () => {
	console.log(`Server is running at http://localhost:${PORT}`);
});
