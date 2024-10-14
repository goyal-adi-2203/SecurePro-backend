import { GoogleAuth } from "google-auth-library";
import dotenv from "dotenv";

dotenv.config();

// Replace with the path to your service account JSON file
const oAuthBase64 = process.env.FIREBASE_OAUTH;
const serviceAccount = JSON.parse(
	Buffer.from(oAuthBase64, "base64").toString("utf-8")
);

// Define the required scopes for FCM
const scopes = ["https://www.googleapis.com/auth/firebase.messaging"];

// Create a client using the service account
export default async function getAccessToken() {
	const auth = new GoogleAuth({
		credentials: serviceAccount,
		scopes: scopes,
	});
	// console.log(auth);

	const client = await auth.getClient();
	const accessTokenResponse = await client.getAccessToken();
    
	return accessTokenResponse.token;
}

// getAccessToken()
// 	.then((token) => {
// 		console.log(`OAuth 2.0 Token: ${token}`);
//         return token;
// 	})
// 	.catch((err) => {
// 		console.error("Error getting OAuth 2.0 token", err);
// 	});
