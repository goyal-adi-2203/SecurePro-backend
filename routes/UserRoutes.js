import { Router } from "express";
import { updateUser } from "../controllers/UserControllers.js";

const userRoutes = Router();

userRoutes.put("/:userId", updateUser);

export default userRoutes;