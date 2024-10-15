import Joi from "joi";
import bcrypt from "bcrypt";

const deviceSchema = Joi.object({
    id: Joi.string().required(),
    name: Joi.string().optional(),
	password: Joi.string().required(),
    deviceType: Joi.string().required(),
    status: Joi.string().required(),
});

const hashPassword = async (password) => {
	const salt = await bcrypt.genSalt();
	return await bcrypt.hash(password, salt);
};

const comparePasswords = async (password, hashedPassword) => {
	return await bcrypt.compare(password, hashedPassword);
};

export { deviceSchema, hashPassword, comparePasswords };
