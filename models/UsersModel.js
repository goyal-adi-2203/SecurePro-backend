import Joi from "joi";
import bcrypt from 'bcrypt';

const userSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
    address: Joi.string().optional(),
    age: Joi.number().optional(),
    email: Joi.string().optional(),
    gender: Joi.string().optional(),
    access_level: Joi.string().required(),
    mobile_no: Joi.string().optional(),
    name: Joi.string().optional()
});

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt();
    return await bcrypt.hash(password, salt);
}

const comparePasswords = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
}

export {userSchema, hashPassword, comparePasswords};