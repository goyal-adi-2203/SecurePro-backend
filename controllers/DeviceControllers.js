import { db } from "../config/firebaseConfig.js";

export const saveDevice = async (request, response, next) => {
	try {
		const { userId, id, name, deviceType } = request.body;

		if (!userId || !id || !name || !deviceType) {
			return response.status(400).json({ message: `Validation error` });
		}

		const userRef = db.collection("devices").doc(userId);

		if (!userRef.exists) {
			return response.status(404).json({ message: "User not found" });
		}

		const deviceRef = userRef.collection("devices").doc(id);
		const deviceDoc = await deviceRef.get();

		if (deviceDoc.exists) {
			await deviceRef.update({ name, deviceType, id });
		} else {
			await deviceRef.set({ name, deviceType, id });
		}

		return response
			.status(200)
			.json({ message: `Device saved successfully` });
	} catch (error) {
		console.log({ error });
		return response.status(500).json({ message: "Internal Server Error" });
	}
};

export const saveDeviceIp = async (request, response, next) => {
	try {
		const { userId, deviceId, ip } = request.body;
        console.log(request.body);
        

		if (!userId || !deviceId || !ip ) {
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
