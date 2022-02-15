# homebridge-smarthomeng
 
**Version v2 is a complete rewrite from scratch and a breaking update.**  
You need to adapt your `config.json` !

## Currently supported accessories
This plugin currently supports the following services (and characteristics):

| Type                                    | Description                                             | 
|:----------------------------------------|:--------------------------------------------------------|
| ContactSensor                           | Simple contact sensor, for example for windows          |
| [Doorbell](#doorbell)                   | Doorbell, sends message to devices on ring              |
| [Fan](#fan)                             | Simple on/off fan, may be extended in future            |
| [Lightbulb](#lightbulb)                 | Everything, from simple light to dimmable, RGB and RGBW |
| [MotionSensor](#motionsensor)           | Detects and reports motion                              |
| [OccupancySensor](#occupancysensor)     | Detects presence in a room                              |
| [Outlet](#outlet)                       | Simple on/off wall outlet                               |
| [TemperatureSensor](#temperaturesensor) | Temperature sensor                                      |
| [Thermostat](#thermostat)               | Thermostat with temperature sensor and heating state    |
| [Switch](#switch)                       | Simple on/off switch                                    |
| [WindowCovering](#windowcovering)       | Window covering (shutters, blinds, ...)                 |

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

### Platform configuration
The following parameters are available to configure the plugin as platform in homebridge.
```json
{
	"platform": "SmartHomeNG",
	"name": "SmartHomeNG",
	"host": "<your SHNG server name or IP>",
	"port": 2425,
	"tls": true,
}
```
If the `port` and `tls` parameters are not specified the plugin defaults to port 2424 without tls encryption.

### Common accessories characteristics
The following characteristics are valid for all accessories:

| Parameter    | Possible values                               | Mandatory | Description                     |
|:-------------|:----------------------------------------------|:----------|:--------------------------------|
| type         | <type> from the above list of supported types | Yes       | Type of accessory               |
| name         | Any \<string>                                 | Yes       | Visible name in HomeKit         |
| manufacturer | Any \<string>                                 | No        | Visible manufacturer in HomeKit |
| model        | Any \<string>                                 | No        | Visible model in HomeKit        |

#### Example:
```json
{
	"type": "OccupancySensor",
	"name": "Presence kitchen",
	"manufacturer": "Preussen",
	"model": "Motion 360 KNX",
}
```
### Doorbell
A doorbell is an accessory that simply sends a message to all devices enrolled in the home that someone rang the doorbell.
HomeKit displays a message that "This accessory is not currently supported by the Home app.".
Further investigation is needed, but for now it still works.
#### Characteristics in addition to [common characteristics](#common-accessories-characteristics) 
| Parameter    | Possible values | Mandatory | Description                            |
|:-------------|:----------------|:----------|:---------------------------------------|
| SinglePress  | <item>          | Yes       | SHNG item to monitor for doorbell ring |

#### Example:
```json
{
	"type": "Doorbell",
	"name": "Main door",
    "SinglePress": "Technik.Asterisk.Klingel"
}
```

### Fan
For now this accessory only supports turning the fan on and off. Further improvements are possible, but i don't have the needed hardware for testing.

#### Characteristics in addition to [common characteristics](#common-accessories-characteristics) 
| Parameter | Possible values | Mandatory | Description                            |
|:----------|:----------------|:----------|:---------------------------------------|
| Active    | <item>          | Yes       | SHNG item to set and get the fan state |

#### Example:

```json
{
	"type": "Fan",
	"name": "Fan bathroom",
    "Active": "OG.Bad.Ventilator"
}
```

### LightBulb
*TODO*

### Occupancy sensor
This sensor is tripped if it detects presence in a room.

#### Characteristics in addition to [common characteristics](#common-accessories-characteristics) 
| Parameter         | Possible values | Mandatory | Description                       |
|:------------------|:----------------|:----------|:----------------------------------|
| OccupancyDetected | <item>          | Yes       | SHNG item to monitor for presence |


#### Example:
```json
{
	"type": "OccupancySensor",
	"name": "Presence bathroom",
	"manufacturer": "Preussen",
	"model": "Motion 360 KNX",
    "OccupancyDetected": "OG.Bad.Praesenz"
}
```

### Motion sensor
This sensor is tripped if it detects motion in a room.

#### Characteristics in addition to [common characteristics](#common-accessories-characteristics) 
| Parameter      | Possible values | Mandatory | Description                     |
|:---------------|:----------------|:----------|:--------------------------------|
| MotionDetected | <item>          | Yes       | SHNG item to monitor for motion |


#### Example:
```json
{
	"type": "OccupancySensor",
	"name": "Presence bathroom",
    "OccupancyDetected": "EG.Flur.Bewegung"
}
```

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
            "port": 2425,
            "tls": true,
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

