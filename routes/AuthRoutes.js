import { Router } from "express";
import { verifyToken } from "../middlewares/TokenMiddleware.js";
import {
	login,
	logout,
	signup,
	userList,
} from "../controllers/AuthControllers.js";

const authRoutes = Router();

authRoutes.post("/signup", signup);
authRoutes.post("/login", login);
authRoutes.post("/logout", logout);
authRoutes.get("/users-logged-in", userList);

export default authRoutes;
