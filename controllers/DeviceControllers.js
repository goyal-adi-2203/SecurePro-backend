import axios from "axios";
import { db } from "../config/firebaseConfig.js";
import {
	comparePasswords,
	deviceSchema,
	hashPassword,
} from "../models/DeviceModel.js";
import { startNgrokTunnel } from "../utils/tunnels.js";

export const fetchDevices = async (request, response, next) => {
	try {
		const { userId } = request.params;
		console.log("get devices for : ", userId);

		const userRef = db.collection("devices").doc(userId);
		const userDoc = await userRef.get();

		if (!userDoc.exists) {
			return response.status(404).json({ message: "User not found" });
		}

		const deviceRef = userRef.collection("devices");
		const deviceDoc = await deviceRef.get();
		const devices = deviceDoc.docs.map((doc) => doc.data());

		console.log(devices);

		return response
			.status(200)
			.json({ devices: devices, message: "Device fetched Successfully" });
	} catch (error) {
		console.error(error);
		response.status(500).json({ message: "Error fetching devices" });
	}
};

export const saveDevice = async (request, response, next) => {
	try {
		const { userId } = request.params;
		const newDevice = request.body;
		console.log(newDevice, userId);

		if (!userId || !newDevice) {
			return response
				.status(400)
				.json({ message: `Validation error missing data` });
		}

		const { error } = deviceSchema.validate(newDevice);
		if (error) {
			return response.status(400).json({ message: `${error}` });
		}

		const userRef = db.collection("devices").doc(userId);
		const userDoc = await userRef.get();

		if (!userDoc.exists) {
			return response.status(404).json({ message: "User not found" });
		}

		const deviceRef = userRef.collection("devices").doc(newDevice.id);
		const deviceDoc = await deviceRef.get();

		newDevice.password = await hashPassword(newDevice.password);

		if (deviceDoc.exists) {
			await deviceRef.update({ ...newDevice, timestamp: Date.now() });
			return response
				.status(200)
				.json({ message: `Device Updated successfully` });
		} else {
			await deviceRef.set({ ...newDevice, timestamp: Date.now() });
			return response
				.status(201)
				.json({ message: `Device created successfully` });
		}
	} catch (error) {
		console.log({ error });
		return response.status(500).json({ message: "Internal Server Error" });
	}
};

export const saveDeviceIp = async (request, response, next) => {
	try {
		const { userId, deviceId, ip } = request.body;
		console.log(request.body);

		if (!userId || !deviceId || !ip) {
			return response.status(400).json({ message: `Validation error` });
		}

		// Reference to the user document
		const userRef = db.collection("devices").doc(userId);
		const deviceRef = userRef.collection("devices").doc(deviceId);
		const deviceDoc = await deviceRef.get();

		if (deviceDoc.exists) {
			// Update device with new IP and FCM token if it exists
			await deviceRef.update({ ip });
		} else {
			// Add new device with IP address and save the token
			await deviceRef.set({ ip });
		}

		return response
			.status(200)
			.json({ message: `Device ip saved successfully` });
	} catch (error) {
		console.log({ error });
		return response.status(500).json({ message: "Internal Server Error" });
	}
};

export const checkPassword = async (request, response, next) => {
	try {
		const { userId, deviceId } = request.params;
		const { password } = request.body;
		// console.log(request.body);

		if (!userId || !deviceId || !password) {
			return response.status(400).json({ message: `Validation error` });
		}

		const userRef = db.collection("devices").doc(userId);
		const userDoc = await userRef.get();

		if (!userDoc.exists) {
			return response.status(404).json({ message: "User not found" });
		}

		const deviceRef = userRef.collection("devices").doc(deviceId);
		const deviceDoc = await deviceRef.get();

		if (!deviceDoc.exists) {
			return response.status(404).json({ message: "Device not found" });
		}

		const deviceData = await deviceDoc.data();
		const hashedPassword = deviceData.password;
		// console.log(deviceData);

		const check = await comparePasswords(password, hashedPassword);
		console.log(check);

		if (check) {
			const deviceIp = deviceData.ip;
			const port = 80;

			const publicUrl = await startNgrokTunnel(deviceIp, port);
			const data = { data: check, message: "Correct Password" };
			console.log(publicUrl);

			try {
				// const deviceResponse = await axios.post(baseUrl, data, {
				// 	headers: { "Content-Type": "application/json" },
				// });

				const deviceResponse = await axios.post(publicUrl, data, {
					headers: { "Content-Type": "application/json" },
					// timeout: 5000,
				});

				console.log("Response from esp", deviceResponse.data);
			} catch (error) {
				console.error("Error sending data : ", error.message);
				return response
					.status(400)
					.json({ message: "Please Try Again" });
			}

			return response
				.status(200)
				.json({ data: check, message: "Correct Password" });
		} else {
			return response
				.status(401)
				.json({ data: check, message: "Incorrect Password" });
		}
	} catch (error) {
		console.log(error);
		return response.status(500).json({ message: "Internal Server Error" });
	}
};
