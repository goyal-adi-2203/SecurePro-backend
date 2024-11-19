#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Replace with your network credentials
const char* ssid = "Airtel_Ram-G";
const char* password = "password";

// Replace with your server's IP or domain
String baseUrl = "https://securepro-backend.onrender.com/api";
String saveIpUrl = "/device/save-ip";
String oAuthUrl = "/fcm/get-oauth-token";
String fcmTokenUrl = "/fcm/get-fcm-token";

// Google api to send notification
String notifUrl = "https://fcm.googleapis.com/v1/projects/pro-cb22e/messages:send";


// Device information
const String userId = "adi2"; 
const String deviceId = "device1";
String oAuthToken = "";
String fcmToken = "";

unsigned long previousMillis = 0;
unsigned long interval = 5000;

void setup() {
  // Start serial communication for debugging
  Serial.begin(115200);

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");

  // Get the local IP address of the ESP32
  String localIp = WiFi.localIP().toString();

  // Prepare the data to be sent to the server
  // Create a JSON object
  StaticJsonDocument<200> jsonDoc;
  jsonDoc["userId"] = userId;
  jsonDoc["deviceId"] = deviceId;
  jsonDoc["ip"] = localIp;

  // Convert JSON object to a string
  String jsonData;
  serializeJson(jsonDoc, jsonData);

  // Send the JSON data to the server
  if (WiFi.status() == WL_CONNECTED) {
    getOAuthToken();
    getFcmToken(jsonData);
    saveIp(jsonData);
  } else {
    Serial.println("WiFi Disconnected");
  }
}

void loop() {
  // No code needed for the loop
  unsigned long currentMillis = millis();
  if(currentMillis - previousMillis >= interval){
    previousMillis = currentMillis;
    sendNotification();
  }
}


void saveIp(String jsonData) {
  HTTPClient http;
  http.begin(baseUrl + saveIpUrl);                        // Specify the URL
  http.addHeader("Content-Type", "application/json");  // Specify content-type header

  int httpResponseCode = http.POST(jsonData);  // Send the request with JSON data

  if (httpResponseCode > 0) {
    // Get the response payload
    int t = 0;
    while (httpResponseCode != 200 && t < 4) {
      httpResponseCode = http.POST(jsonData);
      t++;
    }

    if (httpResponseCode == 200) {
      String response = http.getString();
      Serial.println("Server Response: " + response);
    } else {
      Serial.println("Server Error!");
    }
  } else {
    Serial.println("Error sending data to server: " + String(httpResponseCode));
  }

  http.end();
}

void getOAuthToken() {
  HTTPClient http;
  http.begin(baseUrl + oAuthUrl);                      // Specify the URL
  http.addHeader("Content-Type", "application/json");  // Specify content-type header
  int httpResponseCode2 = http.GET();
  if (httpResponseCode2 > 0) {
    int t = 0;
    while(httpResponseCode2 != 200 && t < 5){
      httpResponseCode2 = http.GET();
      t++;

      String response = http.getString();
      Serial.println("Error response : " + response);
    }
    
      String response = http.getString();
      // Serial.println("oAuth response : " + response);
      // oAuthToken =

      // Parse the JSON response
      StaticJsonDocument<200> doc;
      DeserializationError error = deserializeJson(doc, response);

      // Check if parsing succeeded
      if (!error) {
        // Extract the "data" field from the JSON object
        oAuthToken = doc["data"].as<String>();
        Serial.println("Extracted oAuthToken: " + oAuthToken);
      } else {
        Serial.print(F("deserializeJson() failed: "));
        Serial.println(error.f_str());
      }
  } else {
    Serial.println("Error receiving data : " + String(httpResponseCode2));
  }

  http.end();
}

void getFcmToken(String jsonData) {
  HTTPClient http;
  http.begin(baseUrl + fcmTokenUrl);                      // Specify the URL
  http.addHeader("Content-Type", "application/json");  // Specify content-type header
  int httpResponseCode2 = http.POST(jsonData);
  if (httpResponseCode2 > 0) {
    if (httpResponseCode2 == 200) {
      String response = http.getString();
      // Serial.println("oAuth response : " + response);
      // oAuthToken =

      // Parse the JSON response
      StaticJsonDocument<200> doc;
      DeserializationError error = deserializeJson(doc, response);

      // Check if parsing succeeded
      if (!error) {
        // Extract the "data" field from the JSON object
        fcmToken = doc["data"].as<String>();
        Serial.println("Extracted fcmToken: " + fcmToken);
      } else {
        Serial.print(F("deserializeJson() failed: "));
        Serial.println(error.f_str());
      }

    } else {
      String response = http.getString();
      Serial.println("Error response : " + response);
    }
  } else {
    Serial.println("Error receiving data : " + String(httpResponseCode2));
  }

  http.end();
}

void sendNotification() {
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("Sending notification...");
    HTTPClient http;
    http.begin(notifUrl);  // FCM v1 endpoint
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", "Bearer " + oAuthToken);  // Authorization with OAuth token

    // Create a JSON document to hold the payload
    StaticJsonDocument<200> jsonDoc;

    // Constructing the JSON structure
    JsonObject message = jsonDoc.createNestedObject("message");
    message["token"] = fcmToken;

    JsonObject data = message.createNestedObject("data");
    data["title"] = "Arjun is idiot";
    data["body"] = "said by" + userId;
    data["userId"] = userId;

    JsonObject android = message.createNestedObject("android");
    android["priority"] = "high";

    // Serialize JSON to string
    String jsonData;
    serializeJson(jsonDoc, jsonData);

    int httpResponseCode = http.POST(jsonData);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("HTTP Response Code: " + String(httpResponseCode));
      Serial.println("Response: " + response);
    } else {
      Serial.println("Error on sending POST: " + String(httpResponseCode));
    }

    http.end();
  } else {
    Serial.println("WiFi not connected");
  }
}
