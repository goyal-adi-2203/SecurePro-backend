import Joi from "joi";
import bcrypt from "bcrypt";

const userSchema = Joi.object({
	username: Joi.string().required(),
	password: Joi.string().required(),
	address: Joi.string().optional(),
	age: Joi.number().optional(),
	email: Joi.string().optional(),
	gender: Joi.string().optional(),
	accessLevel: Joi.string().required(),
	mobileNo: Joi.string().optional(),
	name: Joi.string().required(),
	profilePicturePath: Joi.string(),
});

const hashPassword = async (password) => {
	const salt = await bcrypt.genSalt();
	return await bcrypt.hash(password, salt);
};

const comparePasswords = async (password, hashedPassword) => {
	return await bcrypt.compare(password, hashedPassword);
};

export { userSchema, hashPassword, comparePasswords };
