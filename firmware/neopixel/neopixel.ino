/**
  Firmware for https://github.com/chrvadala/neopixel library

  set pixel and apply
  echo -ne '\x01\x10\xff\xff\xff\x02\x00\x00\x00\x00' | nc neopixel.local 800 | hexdump

  set pixels with a color
  echo -ne '\x03\x10\xff\xff\xff' | nc neopixel.local 800 | hexdump

  turn off every pixel
  echo -ne '\x04\x10\xff\xff\xff' | nc neopixel.local 800 | hexdump

**/

#include <WiFiManager.h>
#include <ESP8266mDNS.h>
#include <Adafruit_NeoPixel.h>
#ifdef __AVR__
#include <avr/power.h>
#endif

#define NAME          "neopixel"
#define PIN            D2
#define NUMPIXELS      60

#define CMD_SET         0x01
#define CMD_APPLY       0x02
#define CMD_FILL        0x03
#define CMD_OFF         0x04

#define RES_CONN_ACK    0x01
#define RES_APPLY_ACK   0x02
#define RES_FILL_ACK    0x03
#define RES_OFF_ACK     0x04

const bool debug = false; //enable this increases the latency
const bool wipe = false;

const char fill = 0x00;

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

  bool res = wm.autoConnect(NAME);

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

void loop() {
  handleWifiClient();
}



byte params [5];
bool handleCommand(Stream& client) {
  int n = client.readBytes((byte*)params, 5);
  if (n < 5) return false;

  int cmd = params[0];
  int led = params[1], brightness = params[1];
  int red = params[2];
  int green = params[3];
  int blue = params[4];

  switch (cmd) {
    case CMD_SET:
      pixels.setPixelColor(led, red, green, blue);
      if (debug) Serial.println("CMD_SET " + String(led) + "[" + String(red) + ":" + String(green) + ":" + String(blue) + "]");
      break;

    case CMD_APPLY:
      pixels.show();
      client.write(RES_APPLY_ACK);
      client.write(fill);
      client.write(fill);
      client.write(fill);

      if (debug) Serial.println("CMD_APPLY");
      break;

    case CMD_FILL:
      for (int i = 0; i < NUMPIXELS; i++) {
        pixels.setPixelColor(i, red, green, blue);
      }
      pixels.show();
      client.write(RES_FILL_ACK);
      client.write(fill);
      client.write(fill);
      client.write(fill);
      if (debug) Serial.println("CMD_FILL [" + String(red) + ":" + String(green) + ":" + String(blue) + "]");
      break;

    case CMD_OFF:
      for (int i = 0; i < NUMPIXELS; i++) {
        pixels.setPixelColor(i, 0, 0, 0);
      }
      pixels.show();
      client.write(RES_OFF_ACK);
      client.write(fill);
      client.write(fill);
      client.write(fill);
      if (debug) Serial.println("CMD_OFF");
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
      client.write(fill);
      client.write(fill);
      client.write(fill);

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
