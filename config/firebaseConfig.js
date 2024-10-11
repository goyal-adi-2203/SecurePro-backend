import dotenv from "dotenv";
import admin from 'firebase-admin';
import path from 'path';

dotenv.config();

// console.log(process.env.PATH_TO_CERT_FILE);
const certBase64 = process.env.FIREBASE_CERT;
// const serviceAccount = path.resolve(process.env.PATH_TO_CERT_FILE);
const serviceAccount = JSON.parse(Buffer.from(certBase64, 'base64').toString('utf-8'));

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

export {admin, db};