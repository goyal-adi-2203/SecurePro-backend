import jwt from "jsonwebtoken";
import {
	userSchema,
	hashPassword,
	comparePasswords,
} from "../models/UsersModel.js";
import bcrypt from "bcrypt";
import { db } from "../config/firebaseConfig.js";

export const signup = async (request, response, next) => {
	try {
		const { error } = userSchema.validate(request.body);
		console.log("i m here");

		if (error) {
			return response
				.status(400)
				.send(`Validation error: ${error.details[0].message}`);
		}

		const {
			username,
			password,
			address,
			age,
			email,
			gender,
			access_level,
			mobile_no,
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
			return response.status(400).send("Username already exists");
		}

		const hashedPassword = await hashPassword(password);

		const newUser = {
			username,
			password: hashedPassword,
			address,
			age,
			email,
			gender,
			access_level,
			mobile_no,
			name,
			profilePicturePath,
		};
        
        const userRef = db.collection("users").doc(username);
		await userRef.set(newUser);

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
				access_level: userData.access_level,
				mobile_no: userData.mobile_no,
				name: userData.name,
				profilePicturePath: userData.profilePicturePath,
			},
		});
	} catch (error) {
		console.log({ error });
		return response.status(500).send("Internal Server Error");
	}
};

export const login = async (request, response, next) => {
	const { username, password } = request.body;
	console.log("from login", request.body);

	if (!username || !password) {
		return response.status(400).json({data: `Validation error`});
	}

	// Fetch the user document from Firestore by username
	const userRef = await db.collection("users").doc(username);

	if (userRef.empty) {
		return response.status(400).json({data: `User Not Found`});
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
	return response.status(200).json({
		data: userWithoutPassword,
		message: "Login success",
	});
};
