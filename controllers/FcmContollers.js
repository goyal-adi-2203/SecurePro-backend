import { db } from "../config/firebaseConfig.js";
import getAccessToken from "../utils/oAuthToken.js";

export const saveFcmToken = async (request, response, next) => {
	try {
		const { userId, token } = request.body;
        console.log(request.body);

		if (!userId || !token) {
			return response.status(400).json({ message: `Validation error` });
		}

		const userRef = db.collection("devices").doc(userId);
		const doc = await userRef.get();

		if (doc.exists) {
			await userRef.update({ token: token });
		} else {
			await userRef.set({ token: token });
		}

		return response
			.status(200)
			.json({ message: `Token saved successfully` });
	} catch (error) {
		console.log({ error });
		return response.status(500).json({ message: "Internal Server Error" });
	}
};

export const oAuthToken = async (reqest, response, next) => {
	try {
		const token = await getAccessToken();
		// console.log(token);

		return response
			.status(200)
			.json({ data: token, message: "oAuth successful" });
	} catch (error) {
		return response.status(500).json({ message: "Internal Server Erro!" });
	}
};

export const fetchFcmToken = async (request, response, next) => {
	try {
		const { userId, deviceId } = request.body;
		console.log(request.body);

		if (!userId || !deviceId) {
			return response.status(400).json({ message: `Validation error` });
		}

		// Reference to the user document
		const userRef = db.collection("devices").doc(userId);
		const userDoc = await userRef.get();

		if (userDoc.exists) {
			const userData = await userDoc.data();
			console.log({ userData });

			const token = userData.token;
			// console.log(token);

			return response
				.status(200)
				.json({ data: token, message: "Fcm token success" });
		} else {
			return response.status(404).json({ message: "User Not Found" });
		}
	} catch (error) {
		console.log(error);
		return response.status(500).json({ message: "Internal Server Erro!" });
	}
};

// fvqk4iuyQfO5UevNqHUqbZ:APA91bFp5PUr-lWhVSq47jRarCHmSbMzwe1PxxgFcyrAgQZRex7s9b-zfiBtg0QUZERztziPcHzF6WH8IDoPHtS9RdQuuRQYQbyMC-WzsUD6bqmGamvVjf2bv-XcPfczC3Stve6uy1Ec
