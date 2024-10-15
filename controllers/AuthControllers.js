import jwt from "jsonwebtoken";
import {
	userSchema,
	hashPassword,
	comparePasswords,
} from "../models/UsersModel.js";
import bcrypt from "bcrypt";
import { db } from "../config/firebaseConfig.js";

const loggedInUsers = new Set();

export const signup = async (request, response, next) => {
	try {
		const { error } = userSchema.validate(request.body);
		console.log("i m here");

		if (error) {
			return response
				.status(400)
				.json({message: `Validation error: ${error.details[0].message}`});
		}

		const {
			username,
			password,
			address,
			age,
			email,
			gender,
			accessLevel,
			mobileNo,
			name,
			profilePicturePath,
		} = request.body;

		console.log("from sign up", request.body);
		const existingUser = await db
			.collection("users")
			.where("username", "==", username)
			.get();
		// const userDoc = await userRef;

		if (!existingUser.empty) {
			return response.status(400).json({message: "Username already exists"});
		}

		const hashedPassword = await hashPassword(password);

		const newUser = {
			username,
			password: hashedPassword,
			address,
			age,
			email,
			gender,
			accessLevel,
			mobileNo,
			name,
			profilePicturePath,
		};

		const userRef = db.collection("users").doc(username);
		await userRef.set(newUser);

        const deviceRef = db.collection("devices").doc(username);
        await deviceRef.set({token: ""});

		const createdUser = await userRef.get();
		const userData = createdUser.data();

		return response.status(201).json({
			user: {
				id: userRef.id,
				username: userData.username,
				address: userData.address,
				age: userData.age,
				email: userData.email,
				gender: userData.gender,
				accessLevel: userData.accessLevel,
				mobileNo: userData.mobileNo,
				name: userData.name,
				profilePicturePath: userData.profilePicturePath,
			},
		});
	} catch (error) {
		console.log({ error });
		return response.status(500).json({message: "Internal Server Error"});
	}
};

export const login = async (request, response, next) => {
	const { username, password } = request.body;
	console.log("from login", request.body);

	if (!username || !password) {
		return response.status(400).json({ message: `Validation error` });
	}

	if (loggedInUsers.has(username)) {
		return response.status(400).json({ message: `User already logged in` });
	}

	// Fetch the user document from Firestore by username
	const userRef = await db.collection("users").doc(username);

	if (userRef.empty) {
		return response.status(400).json({ message: `User Not Found` });
	}

	const userDoc = await userRef.get();
	// console.log(userDoc);

	if (!userDoc.exists) {
		console.log("No such document!");
		return response.status(400).json({ message: `User Not Found` });
	}

	const userData = userDoc.data();
	console.log(userData);

	// Compare the provided password with the hashed password in Firestore
	const isPasswordValid = await comparePasswords(password, userData.password);
	if (!isPasswordValid) {
		return response.status(400).json({ message: `Invalid Password` });
	}

	const { password: _, ...userWithoutPassword } = userData;

	loggedInUsers.add(username);

	return response.status(200).json({
		data: userWithoutPassword,
		message: "Login success",
	});
};

export const logout = async (request, response, next) => {
	// console.log(request);

	const { username } = request.body;
	console.log("from logout", username);

	if (!username) {
		return response.status(400).json({ message: `Validation error` });
	}

	if (!loggedInUsers.has(username)) {
		return response.status(400).json({ message: `User not logged in` });
	}

	loggedInUsers.delete(username);
	return response.status(200).json({ message: `User logged out` });
};
