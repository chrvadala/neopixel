/**
*
* Firmware for https://github.com/chrvadala/neopixel library
*
*/

// echo -ne '\x02\x10\x00\x00\xff\x01\x00\x00\x00\x00' | nc rainbow.local 800 | hexdump
// echo -ne '\x03\x00\xff\xff\xff' | nc rainbow.local 800 | hexdump
// echo -ne '\x04\xff\xff\xff\xff' | nc rainbow.local 800 | hexdump

#include <WiFiManager.h>
#include <ESP8266mDNS.h>
#include <Adafruit_NeoPixel.h>
#include <ArduinoJson.h>
#ifdef __AVR__
#include <avr/power.h>
#endif

#define NAME          "rainbow"
#define PIN            D2
#define NUMPIXELS      60

#define CMD_SHOW           0x01
#define CMD_SET_LED        0x02
#define CMD_SET_LEDS       0x03
#define CMD_SET_BRIGHTNESS 0x04

#define RES_CONN_ACK        0x01
#define RES_SHOW_ACK        0x02

const bool debug = false;
const bool wipe = false;

WiFiServer wifiServer(800);
Adafruit_NeoPixel pixels = Adafruit_NeoPixel(NUMPIXELS, PIN, NEO_GRB + NEO_KHZ800);

void setup() {
  WiFiManager wm;

  if (debug) {
    Serial.begin(115200);
    Serial.println("hello");
    wm.setDebugOutput(true);
  }

  if (wipe) wm.resetSettings();

  bool res = wm.autoConnect("Rainbow");

  if (!res) {
    if (debug) Serial.println("Failed to connect");

    ESP.restart();
  }

  if (!MDNS.begin(NAME)) {
    if (debug) Serial.println("Failed announce");
    ESP.restart();
  }

  wifiServer.begin();
  pixels.begin();
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, HIGH);
}

void loop(){
  handleWifiClient();
}



byte params [5];
bool handleCommand(Stream& client) {
  int n = client.readBytes((byte*)params, 5);
  if(n < 5) return false;

  int cmd = params[0];
  int led = params[1], brightness = params[1];
  int red = params[2];
  int green = params[3];
  int blue = params[4];

  switch (cmd) {
    case CMD_SHOW:
      pixels.show();
      client.write(RES_SHOW_ACK);
      if (debug) Serial.println("SHOW");
      break;

    case CMD_SET_LED:
      pixels.setPixelColor(led, red, green, blue);
      if (debug) Serial.println("CMD_SET_LED " + String(led) + "[" + String(red) + ":" + String(green) + ":" + String(blue) + "]");
      break;

    case CMD_SET_LEDS:
      for (int i = 0; i < NUMPIXELS; i++) {
        pixels.setPixelColor(i, red, green, blue);
      }
      pixels.show();
      client.write(RES_SHOW_ACK);
      if (debug) Serial.println("CMD_SET_LEDS [" + String(red) + ":" + String(green) + ":" + String(blue) + "]");
      break;

    case CMD_SET_BRIGHTNESS:
      pixels.setBrightness(brightness);
      if (debug) Serial.println("CMD_SET_BRIGHTNESS [" + String(brightness) + "]");
      break;

    default:
      if (debug) Serial.println("BAD_CMD");
      break;
  }

  return true;
}

void handleWifiClient() {
  WiFiClient client = wifiServer.available();
  bool established = false;
  bool res;

  while (client.connected())  {
    if (!established)    {
      client.write(RES_CONN_ACK);
      established = true;
      digitalWrite(LED_BUILTIN, LOW);
      if (debug) Serial.println("connected");
    }

    if (client.available())    {
      res = handleCommand(client);

      if (!res) {
        if (debug) Serial.println("close");
        client.stop();
        established = false;
        digitalWrite(LED_BUILTIN, HIGH);
      }
    }

    yield();
  }

  if (established) {
    established = false;
    digitalWrite(LED_BUILTIN, HIGH);
    if (debug) Serial.println("disconnected");
  }
}
