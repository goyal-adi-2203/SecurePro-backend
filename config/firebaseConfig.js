import dotenv from "dotenv";
import admin from 'firebase-admin';
import path from 'path';

dotenv.config();

// console.log(process.env.PATH_TO_CERT_FILE);
const serviceAccount = path.resolve(process.env.PATH_TO_CERT_FILE);

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

export {admin, db};