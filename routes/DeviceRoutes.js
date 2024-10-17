import { Router } from "express";
import {
    checkPassword,
	fetchDevices,
	saveDevice,
	saveDeviceIp,
} from "../controllers/DeviceControllers.js";

const deviceRoutes = Router();

deviceRoutes.post("/save-device/:userId", saveDevice);
deviceRoutes.post("/save-ip", saveDeviceIp);
deviceRoutes.get("/fetch/:userId", fetchDevices);
deviceRoutes.post("/check-password/:userId/:deviceId", checkPassword);

export default deviceRoutes;