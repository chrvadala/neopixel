/**
  Firmware for https://github.com/chrvadala/neopixel library
**/

#include "WiFiManager.h"
#include "Adafruit_NeoPixel.h"
#include <stdio.h>
#include <ESP8266mDNS.h>


#define NAME          "neopixel"
#define PIN            D3
#define PIXELS         204
#define DEBUG          false //if enabled this increases the latency
#define WIPE           false //if enabled reset the wireless credentials

uint8_t zeros[] = {0, 0, 0};
#define LOG(...) if(DEBUG) Serial.println(__VA_ARGS__)

#define CMD_APPLY       0x01
#define CMD_SET         0x02
#define CMD_FILL        0x03
#define CMD_OFF         0x04

#define RES_CONN_ACK    0x01
#define RES_APPLY_ACK   0x02

WiFiServer wifiServer(800);
Adafruit_NeoPixel pixels = Adafruit_NeoPixel(PIXELS, PIN, NEO_GRB + NEO_KHZ800);


void setup() {
  WiFiManager wm;

  if (DEBUG) {
    Serial.begin(115200);
    Serial.println("hello");
    wm.setDebugOutput(true);
  }

  if (WIPE) wm.resetSettings();

  bool res = wm.autoConnect(NAME);

  if (!res) {
    LOG("Failed to connect");

    ESP.restart();
  }

  if (!MDNS.begin(NAME)) {
    LOG("Failed announce");
    ESP.restart();
  }

  wifiServer.begin();
  pixels.begin();
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, HIGH);
}

void loop() {
  handleWifiClient();
}


uint8_t params[6];

#define cmd params[0]
#define led *((uint16_t*) &params[1])
#define red params[3]
#define green params[4]
#define blue params[5]

bool handleCommand(Stream& client) {
  if (client.available() < 6) return false;
  int n = client.readBytes(params, 6);

  switch (cmd) {
    case CMD_SET:
      pixels.setPixelColor(led, red, green, blue);
      LOG("CMD_SET " + String(led) + "[" + String(red) + ":" + String(green) + ":" + String(blue) + "]");
      break;

    case CMD_FILL:
      for (int i = 0; i < PIXELS; i++) {
        pixels.setPixelColor(i, red, green, blue);
      }
      LOG("CMD_FILL [" + String(red) + ":" + String(green) + ":" + String(blue) + "]");
      break;

    case CMD_OFF:
      for (int i = 0; i < PIXELS; i++) {
        pixels.setPixelColor(i, 0, 0, 0);
      }
      LOG("CMD_OFF");
      break;

    case CMD_APPLY:
      pixels.show();
      client.write(RES_APPLY_ACK);
      client.write(zeros, 3);
      LOG("CMD_APPLY");
      break;

    default:
      LOG("BAD_CMD");
      break;
  }

  return true;
}

void handleWifiClient() {
  uint16_t pixels = PIXELS;
  WiFiClient client = wifiServer.available();
  bool established = false;
  bool res;

  while (client.connected())  {
    if (!established)    {
      client.write(RES_CONN_ACK);
      client.write((uint8_t*)&pixels, 2);
      client.write(zeros, 1);

      established = true;
      digitalWrite(LED_BUILTIN, LOW);
      LOG("connected");
    }

    handleCommand(client);
    
    yield();
  }

  if (established) {
    client.stop();
    established = false;
    digitalWrite(LED_BUILTIN, HIGH);
    LOG("disconnected");
  }
}
