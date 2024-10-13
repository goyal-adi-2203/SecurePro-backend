import { db } from "../config/firebaseConfig.js";
import { userSchema } from "../models/UsersModel.js";

export const updateUser = async (request, response, next) => {
	try {
		const { userId } = request.params;
		console.log("from update user", userId);

		const userRef = db.collection("users").doc(userId);
		const user = await userRef.get();


		if (!user.exists) {
			return response.status(404).json({ message: "User not found" });
		}

		const {userId: _, ...userBody} = request.body;
		console.log(userBody);

		const { error } = userSchema.validate(userBody);
		if (error) {
			return response.status(400).json({
				message: `Validation error ${error.details[0].message}`,
			});
		}

		if (userBody.username != userId) {
			return response
				.status(400)
				.json({ message: "User id and username does not match" });
		}

		const userData = user.data();
		const newUser = {
			username: userBody.username,
			password: userData.password,
			address: userBody.address,
			age: userBody.age,
			email: userBody.email,
			gender: userBody.gender,
			accessLevel: userData.accessLevel,
			mobileNo: userBody.mobileNo,
			name: userBody.name,
			profilePicturePath: userBody.profilePicturePath,
		};

		await userRef.set(newUser, { merge: true });

		const updatedDoc = await userRef.get();
        const updatedUser = updatedDoc.data();

		return response
			.status(200)
			.json({ data: updateUser, message: "Updated successfully!" });
	} catch (error) {
		console.log({ error });
		return response.status(500).json({ message: "Internal Server Error" });
	}
};
