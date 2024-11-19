// Import the ngrok package
import ngrok from "ngrok";
import dotenv from "dotenv";

dotenv.config();

const ngrokBase64 = process.env.NGROK_AUTH_TOKEN;
const ngrokToken = Buffer.from(ngrokBase64, "base64").toString("utf-8");
// Function to start the ngrok tunnel dynamically
export async function startNgrokTunnel(deviceIp, port) {
	try {
		// Create a tunnel to the device IP and port
		const url = await ngrok.connect({
			addr: `${deviceIp}:${port}`, // Format: device IP and port
			authtoken: ngrokToken, // Optional: specify your ngrok auth token if using Pro version
		});

		// Log the public URL to access the device
		console.log(`Ngrok tunnel created! Your public URL is: ${url}`);
		return url; // Return the public URL
	} catch (error) {
		console.error("Error creating ngrok tunnel:", error);
	}
}
