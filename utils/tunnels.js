// Import the ngrok package
import ngrok from "ngrok";
import dotenv from "dotenv";

dotenv.config();

const ngrokToken = process.env.NGROK_AUTH_TOKEN;

// Function to start the ngrok tunnel dynamically
export async function startNgrokTunnel(deviceIp, port) {
	try {
		// Create a tunnel to the device IP and port
		const url = await ngrok.connect({
			addr: `${deviceIp}:${port}`, // Format: device IP and port
			subdomain: "unique-subdomain", // Optional: specify a custom subdomain (if you have ngrok pro)
			authtoken: ngrokToken, // Optional: specify your ngrok auth token if using Pro version
		});

		// Log the public URL to access the device
		console.log(`Ngrok tunnel created! Your public URL is: ${url}`);
		return url; // Return the public URL
	} catch (error) {
		console.error("Error creating ngrok tunnel:", error);
	}
}
