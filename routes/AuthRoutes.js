import { Router } from "express";
import { verifyToken } from "../middlewares/TokenMiddleware.js";
import { login, logout, signup } from "../controllers/AuthControllers.js";


const authRoutes = Router();


authRoutes.post("/signup", signup);
authRoutes.post("/login", login);
authRoutes.post("/logout", logout);

export default authRoutes;