# homebridge-smarthomeng
 
**Version v2 is a complete rewrite from scratch and a breaking update.**  
You need to adapt your `config.json` !

## Currently supported
This plugin currently supports the following services (and characteristics):

* LightBulb (on/off, brightness, hue, saturation, r, g, b, w)
* Fan (active)
* TemperatureSensor (current temperature)
* Thermostat (current- / target temperature, currentheatingcoolingstate)
* MotionSensor (motion detected)
* OccupancySensor (presence detected)
* ContactSensor (contact state)
* Switch (on/off)
* Outlet (on/off)
* WindowCovering (CurrentPosition, TargetPosition).

Other accessories are being worked on and will be added as soon as ready.

## Requirements
* [SmartHomeNG](https://github.com/smarthomeNG/smarthome)
* [homebridge](https://www.npmjs.com/package/homebridge)

## Installation
### Install nodejs >=14.18.1
See [NodeJS](https://nodejs.org/en/) website for details depending on your OS.

### Install libavahi-compat-libdnssd-dev lib
For me i needed these libraries to be installed for my homebridge to work. See their [Homepage](https://homebridge.io) for installation instructions.  
Below is what i did on my Debian Bullseye installation:


	sudo apt install libavahi-compat-libdnssd-dev


### Install homebridge >=1.3.5 from NPM repository

	npm install -g homebridge --unsafe-perm


### Install this plugin from NPM repository

	npm install -g homebridge-smarthomeng --unsafe-perm


## Configuration
If you already have a working homebridge installation just add the platform section into your existing config. If you are a new homebridge user you have to create a `config.json` file in the `.homebridge` directory. You'll find that directory in your home folder.

### Common characteristics
The following characteristics are valid for all accessories.  

Mandatory:

```json
{
"type": "OccupancySensor",
"name": "Presence kitchen",
}
```

Optional:
```json
{
"manufacturer": "Preussen",
"model": "Motion 360 KNX",
}
```
### Doorbell
*TODO*

### Fan
*TODO*

### LightBulb
*TODO*

### Occupancy sensor
*TODO*

### Motion sensor
*TODO*

### Contact sensor
*TODO*

### Switch
*TODO*

### Outlet
*TODO*

### Temperature sensor
*TODO*

### Thermostat
*TODO*

### WindowCovering
In addition to the common characteristics the following are available.

Mandatory:
```json
{
"CurrentPosition": "EG.Buero.Rolladen.Position",
"TargetPosition": "EG.Buero.Rolladen.ZielPosition",
}
```
The current moving state and direction is automatically derived from the difference between the current and target position.

Optional:
```json
{
"CurrentPositionMin": 0,
"CurrentPositionMax": 255,
"CurrentPositionInverted": true,
"TargetPositionMin": 0,
"TargetPositionMax": 255,
"TargetPositionInverted": true
}
```
HomeKit works with values between 0 and 100 where 0 is completely closed and 100 is open.  
My KNX installation, as example, needs values between 0 and 255 where 255 is completely closed and 0 is open.  
The above optional parameters allow you to specify the neede range for your device. If needed the values can be inverted at the same time. The plugin then transposes the values in both directions.

### Example configuration file
This is an example config file which just uses this plugin and some example SmartHomeNG items.

```json
{
    "bridge": {
        "name": "SmartHomeNG",
        "username": "CC:22:3D:E3:DE:37",
        "port": 51138,
        "pin": "655-59-9284"
    },

    "platforms": [
        {
            "platform": "SmartHomeNG",
            "name": "SmartHomeNG",
            "host": "smarthome.iot.wagener.family",
            "accessories": [
                {
                    "type": "Outlet",
                    "name": "Steckdose Esszimmer",
                    "On": "EG.Esszimmer.Steckdose"
                },
                {
                    "type": "OccupancySensor",
                    "name": "Präsenz Büro",
                    "manufacturer": "Preussen",
                    "model": "Motion 360 KNX",
                    "OccupancyDetected": "EG.Buero.Praesenz"
                },
                {
                    "type": "MotionSensor",
                    "name": "Bewegung Flur",
                    "manufacturer": "Preussen",
                    "model": "Motion 360 KNX",
                    "MotionDetected": "EG.Flur.Praesenz"
                },
                {
                    "type": "ContactSensor",
                    "name": "Fenster Büro",
                    "ContactState": "EG.Buero.Fenster"
                },
                {
                    "type": "Doorbell",
                    "name": "Haustür",
                    "SinglePress": "Technik.Asterisk.Klingel"
                },
                {
                    "type": "Lightbulb",
                    "name": "Licht Büro",
                    "On": "EG.Buero.Deckenspots",
                    "Brightness": "EG.Buero.Deckenspots.dimmen",
                    "BrightnessMin": 0,
                    "BrightnessMax": 255
                }
                {
                    "type": "Lightbulb",
                    "name": "RGB Leiste Stube",
                    "On": "EG.Stube.Ledleiste",
                    "Brightness": "EG.Stube.Ledleiste.dimmen",
                    "BrightnessMin": 0,
                    "BrightnessMax": 255,
                    "R": "EG.Stube.Ledleiste.R.dimmen",
                    "RMin": 0,
                    "RMax": 255,
                    "G": "EG.Stube.Ledleiste.G.dimmen",
                    "GMin": 0,
                    "GMax": 255,
                    "B": "EG.Stube.Ledleiste.B.dimmen",
                    "BMin": 0,
                    "BMax": 255,
                    "W": "EG.Stube.Ledleiste.W.dimmen",
                    "WMin": 0,
                    "WMax": 255
                },
                {
                    "type": "Fan",
                    "name": "Ventilator Bad",
                    "Active": "OG.Bad.Ventilator"
                },
                {
                    "type": "Thermostat",
                    "name": "Temperatur Büro",
                    "CurrentTemperature": "EG.Buero.Temperatur",
                    "TargetTemperature": "EG.Buero.Temperatur.Sollwert",
                    "CurrentHeatingCoolingState": "EG.Buero.Temperatur.Modus"
                },
                {
                    "type": "WindowCovering",
                    "name": "Shutters office",
                    "CurrentPosition": "EG.Buero.Rolladen.Position",
                    "CurrentPositionMin": 0,
                    "CurrentPositionMax": 255,
                    "CurrentPositionInverted": true,
                    "TargetPosition": "EG.Buero.Rolladen.ZielPosition",
                    "TargetPositionMin": 0,
                    "TargetPositionMax": 255,
                    "TargetPositionInverted": true
                }
            ]
        }
    ],

    "description": "This is my development config file."

}
```

