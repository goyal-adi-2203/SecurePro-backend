import { Router } from "express";
import {
	oAuthToken,
	saveFcmToken,
	fetchFcmToken,
} from "../controllers/FcmContollers.js";


const fcmRoutes = Router();

fcmRoutes.post("/save-token", saveFcmToken);
fcmRoutes.get("/get-oauth-token", oAuthToken);
fcmRoutes.post("/get-fcm-token", fetchFcmToken);

export default fcmRoutes;