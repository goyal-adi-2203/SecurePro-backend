import jwt from "jsonwebtoken";
import { userSchema, hashPassword, comparePasswords } from "../models/UsersModel.js";
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
		} = request.body;
        
        console.log("from sign up", request.body);

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
		};

		const userRef = await db.collection("users").add(newUser);
        
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
				mobile_no : userData.mobile_no,
				name: userData.name,
			},
		});
	} catch (error) {
		console.log({ error });
		return response.status(500).send("Internal Server Error");
	}
};


export const login = async (request, response, next) => {
	const { userId, username, password } = request.body;
    console.log("from login", request.body);

	if (!username || !password) {
		return response.status(400).send(`Validation error`);
	}

	// Fetch the user document from Firestore by username
	const userRef = await db
		.collection("users")
		.doc(userId);

	if (userRef.empty) {
		return response
			.status(400)
			.send(`User Not Found`);
	}

	const userDoc = await userRef.get();
    // console.log(userDoc);
    
    if (!userDoc.exists) {
		console.log("No such document!");
		return null;
	}

	const userData = userDoc.data();
    console.log(userData);
    
	// Compare the provided password with the hashed password in Firestore
	const isPasswordValid = await comparePasswords(password, userData.password);
    if (!isPasswordValid) {
		return response
				.status(400)
				.send(`Invalid password`);
	}

	const { password: _, ...userWithoutPassword } = userData;
	return response.status(200).json({
        data: userWithoutPassword,
        message: "Login success"
    });
}