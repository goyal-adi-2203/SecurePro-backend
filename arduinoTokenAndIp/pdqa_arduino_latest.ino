#include <LiquidCrystal.h>
#if defined(ESP32)
#include <WiFi.h>
#elif defined(ESP8266)
#include <ESP8266WiFi.h>
#endif
#include <ESP_Mail_Client.h>
#include <Keypad.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SD.h>
#include <ESPAsyncWebServer.h>

#define LOCKTIME 1000
#define BUZZTIME 3000
#define ENTERKEY '#'
#define Password_Length 8
#define WIFI_SSID "Airtel_Ram-G"
#define WIFI_PASSWORD "password"

/** The smtp host name **/
#define SMTP_HOST "smtp.gmail.com"
#define SMTP_PORT 465

/* The sign in credentials for sender */
#define AUTHOR_EMAIL "group.8.2025@gmail.com"
#define AUTHOR_PASSWORD "sucd pbpr oheh uvab"

/* Recipient's email*/
#define RECIPIENT_EMAIL "goyal22aditya@gmail.com"

/* Declare the global used SMTPSession and Sessino_Config object for SMTP transport and configuration */
SMTPSession smtp;
Session_Config config;

void sendNotification(String title, String body);

/* Callback function to get the Email sending status */
void smtpCallback(SMTP_Status status);

// LCD Pins and Object initialisation
const int rs = 5, en = 4, d4 = 22, d5 = 21, d6 = 19, d7 = 18;
LiquidCrystal lcd(rs, en, d4, d5, d6, d7);

const int REED_PIN = 23;
const int BUZZER_PIN = 2;
unsigned int previousMillis = 0;
int gateopenTime = 0;
int startTime = 0;

bool Unlocked_Mode = true;
bool opened = false;
bool doorMail = false;
bool theftMail = false;

char Data[Password_Length];
// char Master[Password_Length] = "123A456";
char Master[Password_Length] = "ABC";
char customKey;
char dummyKey;

byte data_count = 0, master_count = 0;

// Keypad rows and columns
const byte ROWS = 4;
const byte COLS = 4;

// Keypad Matrix
char hexaKeys[ROWS][COLS] = {
    {'1', '2', '3', 'A'},
    {'4', '5', '6', 'B'},
    {'7', '8', '9', 'C'},
    {'*', '0', '#', 'D'}};

// declaration of pins for keypad
byte rowPins[ROWS] = {13, 12, 14, 27};
byte colPins[COLS] = {26, 25, 33, 32};

// keypad object initialisation
Keypad customKeypad = Keypad(makeKeymap(hexaKeys), rowPins, colPins, ROWS, COLS);

// Replace with your server's IP or domain
String baseUrl = "https://securepro-backend.onrender.com/api";
// String baseUrl = "http://192.168.1.8:8747/api";
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

// THIS IS NEW FOR RECEIVING PASSWORD
AsyncWebServer server(80);
// THIS IS PASSWORD

bool passwordFromPhone = false;

// This function contains the initial setup for the ESP32
void setup()
{

    // global variables
    Unlocked_Mode = true;
    opened = false;

    // Input and output pins setup
    pinMode(BUZZER_PIN, OUTPUT);
    digitalWrite(BUZZER_PIN, LOW);
    pinMode(REED_PIN, INPUT_PULLUP);

    // Serial monitor setup
    Serial.begin(9600);

    // LCD setup
    lcd.begin(16, 2);
    lcd.clear();

    Serial.println();

    // Wifi Connection
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print("Connecting to Wi-Fi");
    while (WiFi.status() != WL_CONNECTED)
    {
        Serial.print(".");
        delay(300);
    }
    Serial.println();
    Serial.print("Connected with IP: ");
    String localIp = WiFi.localIP().toString();
    Serial.println(WiFi.localIP());
    Serial.println();

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
    if (WiFi.status() == WL_CONNECTED)
    {
        getOAuthToken();
        getFcmToken(jsonData);
        saveIp(jsonData);
    }
    else
    {
        Serial.println("WiFi Disconnected");
    }

    /*  Set the network reconnection option */
    MailClient.networkReconnect(true);

    // SMTP setup
    smtp.debug(1);
    smtp.callback(smtpCallback);

    /* Set the session config */
    config.server.host_name = SMTP_HOST;
    config.server.port = SMTP_PORT;
    config.login.email = AUTHOR_EMAIL;
    config.login.password = AUTHOR_PASSWORD;
    config.login.user_domain = "";

    // NTP config for system clock synchronization
    config.time.ntp_server = F("pool.ntp.org,time.nist.gov");
    config.time.gmt_offset = 3;
    config.time.day_light_offset = 0;

    /* Connect to the server */
    // if (!smtp.connect(&config)){
    //   ESP_MAIL_PRINTF("Connection error, Status Code: %d, Error Code: %d, Reason: %s", smtp.statusCode(), smtp.errorCode(), smtp.errorReason().c_str());
    //   return;
    // }

    // if (!smtp.isLoggedIn()){
    //   Serial.println("\nNot yet logged in.");
    // }
    // else{
    //   if (smtp.isAuthenticated())
    //     Serial.println("\nSuccessfully logged in.");
    //   else
    //     Serial.println("\nConnected with no Auth.");
    // }

    // Timer setup
    startTime = millis(); // This is when the timer starts

    // THIS IS FOR ASYNC WEBSERVER
    // Define POST route and attach handler
    // Setup server
    server.on(
        "/",
        HTTP_POST,
        [](AsyncWebServerRequest *request) {}, // Empty onRequest handler
        nullptr,                               // No onUpload handler
        handlePostRequest                      // onBody handler
    );

    // Start server
    server.begin();
    Serial.println("Server started");
}

void loop()
{
    if (Unlocked_Mode)
    {
        int proximity = digitalRead(REED_PIN);

        // start timer to check for LOCKTIME when locking the gate
        int endTime = millis() - startTime;

        Serial.print("endTime: ");
        Serial.println(endTime);
        delay(1000);

        if (endTime >= LOCKTIME && proximity == HIGH)
        {
            // Buzzer ON
            digitalWrite(BUZZER_PIN, HIGH);

            lcd.setCursor(0, 0);
            lcd.print("Close the Door!!");
            delay(1000);
        }
        else if (endTime >= LOCKTIME && proximity == LOW)
        {
            // Buzzer OFF
            digitalWrite(BUZZER_PIN, LOW);

            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print("Locked Mode");
            lcd.setCursor(0, 1);
            lcd.print("Activated");
            delay(1000);

            Unlocked_Mode = false;
        }
    }
    else if (!Unlocked_Mode)
    {
        int proximity = digitalRead(REED_PIN);

        if (!opened && proximity == HIGH)
        {
            opened = true;

            // start timer to check for BUZZTIME when gate is opened
            gateopenTime = millis();

            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print("Enter Password : ");
        }

        if (opened)
        {
            int newMillis = millis() - gateopenTime;

            // Take keypad input
            customKey = customKeypad.getKey();
            dummyKey = customKey;

            if (customKey != NO_KEY)
            {
                // pressed ANY KEY
                if (customKey != ENTERKEY)
                {
                    // store keypad input in system
                    Data[data_count] = customKey;
                    Serial.println(customKey);

                    // print on screen
                    lcd.setCursor(data_count, 1);
                    lcd.print(customKey);
                    data_count++;
                    delay(500);
                    lcd.setCursor(data_count - 1, 1);
                    lcd.print("*");
                }

                // pressed ENTER KEY
                if (dummyKey == ENTERKEY)
                {
                    Serial.println("#");

                    // Correct Password in entered
                    if (checkPass(Data, Master))
                    {

                        // Do not ring buzzer or if buzzer is on, turn off buzzer
                        digitalWrite(BUZZER_PIN, LOW);
                        Serial.println("Buzzer is Off");
                        Serial.println("Password Matched");
                        delay(3000);
                        lcd.noDisplay();

                        // send the esp in deep to restart when next time turned ON
                        esp_deep_sleep_start();
                    }

                    // clear the keypad input data
                    clearData();
                }
            }

            // if correct password is not entered before BUZZTIME
            if (newMillis == BUZZTIME)
            {
                // buzzer on
                digitalWrite(BUZZER_PIN, HIGH);
                Serial.println("Buzzer is on 30sec exceeded");

                // Send Mail to the user
                if (!theftMail)
                {
                    // sendMail();
                    sendNotification("Intruder Alert !!!!", "Buzzer time has exceeded, there maybe a theft happening in your home right now.");
                    theftMail = true;
                }
            }
        }
    }

    if (passwordFromPhone)
    {
        String receivedMessage = "Correct Password.";

        // correct password is entered
        Serial.println(receivedMessage);

        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Password Matched");
        lcd.setCursor(0, 1);
        lcd.print("Welcome Home!!");

        // Do not ring buzzer or if buzzer is on, turn off buzzer
        digitalWrite(BUZZER_PIN, LOW);
        Serial.println("Buzzer is Off");
        Serial.println("Password Matched");
        delay(3000);
        lcd.noDisplay();

        // send notif
        sendNotification("Correct Password", "Device " + deviceId + " is unlocked.");

        // clear the keypad input data
        clearData();

        // send the esp in deep to restart when next time turned ON
        // esp_deep_sleep_start();
        passwordFromPhone = false;
    }
}

// Function to handle POST requests
void handlePostRequest(AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total)
{
    // Parse JSON data
    StaticJsonDocument<200> jsonDoc;
    DeserializationError error = deserializeJson(jsonDoc, data, len);

    if (error)
    {
        Serial.print("JSON parsing failed: ");
        Serial.println(error.c_str());
        request->send(400, "application/json", "{\"message\":\"Invalid JSON\"}");
        return;
    }

    // Extract JSON fields
    String receivedData = jsonDoc["data"];
    String receivedMessage = jsonDoc["message"];

    Serial.println("Data received:");
    Serial.println("data: " + receivedData);
    Serial.println("message: " + receivedMessage);

    if (receivedData == "true")
    {
        passwordFromPhone = true;

        // Send response
        String responseMessage = "{\"message\":\"Data received successfully and matched\"}";
        request->send(200, "application/json", responseMessage);
    }
    else
    {
        // Send response
        String responseMessage = "{\"message\":\"Data received successfully and matched\"}";
        request->send(200, "application/json", responseMessage);
    }
}

/* Function to match the entered password with the correct Password */
bool checkPass(char input[], char password[])
{
    if (!strcmp(input, password))
    {
        // correct password is entered
        Serial.println("Correct Password");

        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Password Matched");
        lcd.setCursor(0, 1);
        lcd.print("Welcome Home!!");

        return true;
    }
    else
    {
        // Incorrect password in entered
        Serial.println("Incorrect Password");

        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Wrong Password");

        return false;
    }
}

/* Function to clear the input data from the device */
void clearData()
{
    while (data_count != 0)
    {
        Data[data_count--] = 0;
    }
    return;
}

/* Function to send the mail to the user if intruders are in the house*/
void sendMail()
{

    /* Declare the message class */
    SMTP_Message message;

    /* Set the message headers */
    message.sender.name = F("Group 8 Theft Alert !!!");
    message.sender.email = AUTHOR_EMAIL;
    message.subject = F("Urgent: Intruder Alert");
    message.addRecipient(F("Aditya"), RECIPIENT_EMAIL);

    // Send raw text message
    String textMsg = "Attention,\n\nOur security system has detected intruders attempting unauthorized access. Immediate action is essential to safeguard our premises and data. Please adhere to security protocols and report any suspicious activity promptly.\n\nThank you for your cooperation.\n\nRegards,\nGroup 8";
    message.text.content = textMsg.c_str();
    message.text.charSet = "us-ascii";
    message.text.transfer_encoding = Content_Transfer_Encoding::enc_7bit;

    message.priority = esp_mail_smtp_priority::esp_mail_smtp_priority_low;
    message.response.notify = esp_mail_smtp_notify_success | esp_mail_smtp_notify_failure | esp_mail_smtp_notify_delay;

    /* Start sending Email and close the session */
    if (!MailClient.sendMail(&smtp, &message))
        ESP_MAIL_PRINTF("Error, Status Code: %d, Error Code: %d, Reason: %s", smtp.statusCode(), smtp.errorCode(), smtp.errorReason().c_str());
}

/* Function to send the mail to the user if door is open */
void sendMailDoor()
{

    /* Declare the message class */
    SMTP_Message message;

    /* Set the message headers */
    message.sender.name = F("Group 8 Theft Alert !!!");
    message.sender.email = AUTHOR_EMAIL;
    message.subject = F("Urgent: Door Open");
    message.addRecipient(F("Aditya"), RECIPIENT_EMAIL);

    // Send raw text message
    String textMsg = "Attention,\n\nOur security system has detected that you have forgot to shut the door. Immediate action is essential to safeguard our premises and data. Please adhere to security protocols and report any suspicious activity promptly.\n\nThank you for your cooperation.\n\nRegards,\nGroup 8";
    message.text.content = textMsg.c_str();
    message.text.charSet = "us-ascii";
    message.text.transfer_encoding = Content_Transfer_Encoding::enc_7bit;

    message.priority = esp_mail_smtp_priority::esp_mail_smtp_priority_low;
    message.response.notify = esp_mail_smtp_notify_success | esp_mail_smtp_notify_failure | esp_mail_smtp_notify_delay;

    if (!smtp.isLoggedIn())
    {
        Serial.println("\nNot yet logged in.");
    }
    else
    {
        if (smtp.isAuthenticated())
            Serial.println("\nSuccessfully logged in.");
        else
            Serial.println("\nConnected with no Auth.");
    }

    /* Start sending Email and close the session */
    if (!MailClient.sendMail(&smtp, &message))
        ESP_MAIL_PRINTF("Error, Status Code: %d, Error Code: %d, Reason: %s", smtp.statusCode(), smtp.errorCode(), smtp.errorReason().c_str());
}

/* Callback function to get the Email sending status */
void smtpCallback(SMTP_Status status)
{
    /* Print the current status */
    Serial.println(status.info());

    /* Print the sending result */
    if (status.success())
    {
        Serial.println("----------------");
        ESP_MAIL_PRINTF("Message sent success: %d\n", status.completedCount());
        ESP_MAIL_PRINTF("Message sent failed: %d\n", status.failedCount());
        Serial.println("----------------\n");

        for (size_t i = 0; i < smtp.sendingResult.size(); i++)
        {
            /* Get the result item */
            SMTP_Result result = smtp.sendingResult.getItem(i);

            ESP_MAIL_PRINTF("Message No: %d\n", i + 1);
            ESP_MAIL_PRINTF("Status: %s\n", result.completed ? "success" : "failed");
            ESP_MAIL_PRINTF("Date/Time: %s\n", MailClient.Time.getDateTimeString(result.timestamp, "%B %d, %Y %H:%M:%S").c_str());
            ESP_MAIL_PRINTF("Recipient: %s\n", result.recipients.c_str());
            ESP_MAIL_PRINTF("Subject: %s\n", result.subject.c_str());
        }
        Serial.println("----------------\n");

        smtp.sendingResult.clear();
    }
}

void saveIp(String jsonData)
{
    HTTPClient http;
    http.begin(baseUrl + saveIpUrl);                    // Specify the URL
    http.addHeader("Content-Type", "application/json"); // Specify content-type header

    int httpResponseCode = http.POST(jsonData); // Send the request with JSON data

    if (httpResponseCode > 0)
    {
        // Get the response payload
        int t = 0;
        while (httpResponseCode != 200 && t < 4)
        {
            httpResponseCode = http.POST(jsonData);
            t++;
        }

        if (httpResponseCode == 200)
        {
            String response = http.getString();
            Serial.println("Server Response: " + response);
        }
        else
        {
            Serial.println("Server Error!");
        }
    }
    else
    {
        Serial.println("Error sending data to server: " + String(httpResponseCode));
    }

    http.end();
}

void getOAuthToken()
{
    HTTPClient http;
    http.begin(baseUrl + oAuthUrl);                     // Specify the URL
    http.addHeader("Content-Type", "application/json"); // Specify content-type header
    int httpResponseCode2 = http.GET();
    if (httpResponseCode2 > 0)
    {
        int t = 0;
        while (httpResponseCode2 != 200 && t < 5)
        {
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
        if (!error)
        {
            // Extract the "data" field from the JSON object
            oAuthToken = doc["data"].as<String>();
            Serial.println("Extracted oAuthToken: " + oAuthToken);
        }
        else
        {
            Serial.print(F("deserializeJson() failed: "));
            Serial.println(error.f_str());
        }
    }
    else
    {
        Serial.println("Error receiving data : " + String(httpResponseCode2));
    }

    http.end();
}

void getFcmToken(String jsonData)
{
    HTTPClient http;
    http.begin(baseUrl + fcmTokenUrl);                  // Specify the URL
    http.addHeader("Content-Type", "application/json"); // Specify content-type header
    int httpResponseCode2 = http.POST(jsonData);
    if (httpResponseCode2 > 0)
    {
        if (httpResponseCode2 == 200)
        {
            String response = http.getString();
            // Serial.println("oAuth response : " + response);
            // oAuthToken =

            // Parse the JSON response
            StaticJsonDocument<200> doc;
            DeserializationError error = deserializeJson(doc, response);

            // Check if parsing succeeded
            if (!error)
            {
                // Extract the "data" field from the JSON object
                fcmToken = doc["data"].as<String>();
                Serial.println("Extracted fcmToken: " + fcmToken);
            }
            else
            {
                Serial.print(F("deserializeJson() failed: "));
                Serial.println(error.f_str());
            }
        }
        else
        {
            String response = http.getString();
            Serial.println("Error response : " + response);
        }
    }
    else
    {
        Serial.println("Error receiving data : " + String(httpResponseCode2));
    }

    http.end();
}

void sendNotification(String title, String body)
{
    if (WiFi.status() == WL_CONNECTED)
    {
        Serial.println("Sending notification...");
        HTTPClient http;
        http.begin(notifUrl); // FCM v1 endpoint
        http.addHeader("Content-Type", "application/json");
        http.addHeader("Authorization", "Bearer " + oAuthToken); // Authorization with OAuth token

        // Create a JSON document to hold the payload
        StaticJsonDocument<200> jsonDoc;

        // Constructing the JSON structure
        JsonObject message = jsonDoc.createNestedObject("message");
        message["token"] = fcmToken;

        JsonObject data = message.createNestedObject("data");
        data["title"] = title;
        data["body"] = body;
        data["userId"] = userId;

        JsonObject android = message.createNestedObject("android");
        android["priority"] = "high";

        // Serialize JSON to string
        String jsonData;
        serializeJson(jsonDoc, jsonData);

        int httpResponseCode = http.POST(jsonData);

        if (httpResponseCode > 0)
        {
            String response = http.getString();
            Serial.println("HTTP Response Code: " + String(httpResponseCode));
            Serial.println("Response: " + response);
        }
        else
        {
            Serial.println("Error on sending POST: " + String(httpResponseCode));
        }

        http.end();
    }
    else
    {
        Serial.println("WiFi not connected");
    }
}