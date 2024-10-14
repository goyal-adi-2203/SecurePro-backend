import { Router } from "express";
import { saveDevice, saveDeviceIp } from "../controllers/DeviceControllers.js";


const deviceRoutes = Router();

deviceRoutes.post("/save-device", saveDevice);
deviceRoutes.post("/save-ip", saveDeviceIp);

export default deviceRoutes;