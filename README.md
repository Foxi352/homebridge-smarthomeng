# homebridge-smarthomeng
 
**Version v2 is a complete rewrite from scratch and a breaking update.**  
You need to adapt your `config.json` !

## Currently supported accessories
This plugin currently supports the following services (and characteristics):

| Type                                     | Description                                             | 
|:-----------------------------------------|:--------------------------------------------------------|
| [ContactSensor](#contact-sensor)         | Simple contact sensor, for example for windows          |
| [Doorbell](#doorbell)                    | Doorbell, sends message to devices on ring              |
| [Fan](#fan)                              | Simple on/off fan, may be extended in future            |
| [Lightbulb](#lightbulb)                  | Everything, from simple light to dimmable, RGB and RGBW |
| [MotionSensor](#motion-sensor)           | Detects and reports motion                              |
| [OccupancySensor](#occupancy-sensor)     | Detects presence in a room                              |
| [Outlet](#outlet)                        | Simple on/off wall outlet                               |
| [SecuritySystem](#security-system)       | Intrusion alarm system                                  |
| [Switch](#switch)                        | Simple on/off switch                                    |
| [TemperatureSensor](#temperature-sensor) | Temperature sensor                                      |
| [Thermostat](#thermostat)                | Thermostat with temperature sensor and heating state    |
| [WindowCovering](#window-covering)       | Window covering (shutters, blinds, ...)                 |

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

| Parameter | Possible values                        | Mandatory | Description                                         |
|:----------|:---------------------------------------|:----------|:----------------------------------------------------|
| platform  | Any \<string>                          | Yes       | Internal name of your platform                      |
| name      | Any \<string>                          | Yes       | Visible name in HomeKit                             |
| host      | IP address or FQDN of your SHNG server | Yes       | Your SHNG host                                      |
| port      | Port \<number>                         | No        | Listening port of websocket module. Default is 2424 |
| tls       | \<boolean>                             | No        | Should TLS encryption be used. Defaults is 'false'  |

#### Example configuration:
```json
{
    "platform": "SmartHomeNG",
    "name": "SmartHomeNG",
    "host": "smarthome.my.domain",
    "port": 2425,
    "tls": true,
}
```
### Common accessories characteristics
The following characteristics are valid for all accessories:

| Parameter    | Possible values                | Mandatory | Description                     |
|:-------------|:-------------------------------|:----------|:--------------------------------|
| type         | Supported \<type> of accessory | Yes       | Type from the [list of supported accessories](#currently-supported-accessories) |
| name         | Any \<string>                  | Yes       | Visible name in HomeKit         |
| manufacturer | Any \<string>                  | No        | Visible manufacturer in HomeKit |
| model        | Any \<string>                  | No        | Visible model in HomeKit        |

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
| SinglePress  | \<item>         | Yes       | SHNG item to monitor for doorbell ring |

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
| Active    | \<item>         | Yes       | SHNG item to set and get the fan state |

#### Example:

```json
{
    "type": "Fan",
    "name": "Fan bathroom",
    "Active": "OG.Bad.Ventilator"
}
```

### LightBulb
Lightbulb can be as simple as a generic on/off light, but can also be as complex as a full RGBW led strip.

#### Characteristics in addition to [common characteristics](#common-accessories-characteristics) 
| Parameter     | Possible values | Mandatory | Default | Description                                                     |
|:--------------|:----------------|:----------|:--------|:----------------------------------------------------------------|
| On            | \<item>         | Yes       |         | SHNG item to switch the lightbuld on or off                     |       
| Brightness    | \<item>         | No        |         | SHNG item to monitor and set the brigtness for a dimmable light |
| BrightnessMin | \<number>       | No        | 0       | Your device's minimum value for brightness                      |
| BrightnessMax | \<number>       | No        | 100     | Your device's maximum value for brightness                      |
| Hue           | \<item>         | No        |         | SHNG item to get and set the HUE in case of a HSB light         |
| Saturation    | \<item>         | No        |         | SHNG item to get and set the saturation in case of a HSB light  |
| R             | \<item>         | No        |         | SHNG item for the RED color in case of RGB(W) light             |
| RMin          | \<number>       | No        | 0       | Your device's minimum value for the RED color                   |
| RMax          | \<number>       | No        | 100     | Your device's maximum value for RED color                       |
| G             | \<item>         | No        |         | SHNG item for the GREEN color in case of RGB(W) light           |
| GMin          | \<number>       | No        | 0       | Your device's minimum value for the GREEN color                 |
| GMax          | \<number>       | No        | 100     | Your device's maximum value for GREEN color                     |
| B             | \<item>         | No        |         | SHNG item for the BLUE color in case of RGB(W) light            |
| BMin          | \<number>       | No        | 0       | Your device's minimum value for the BLUE color                  |
| BMax          | \<number>       | No        | 100     | Your device's maximum value for BLUE color                      |


#### Additional comments
HomeKit works with values between 0 and 100 where 0 is completely dim and 100 is maximum brightness.  
My KNX installation, as example, needs values between 0 and 255.  
The above optional min and max parameters allow you to specify the neede range for your device. The plugin then transposes the values in both directions.

#### Example (used for my KNX RGBW strip):
```json
{
    "type": "Lightbulb",
    "name": "RGBW strip living room",
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
}
```

### Occupancy sensor
This sensor is tripped if it detects presence in a room.

#### Characteristics in addition to [common characteristics](#common-accessories-characteristics) 
| Parameter         | Possible values | Mandatory | Description                       |
|:------------------|:----------------|:----------|:----------------------------------|
| OccupancyDetected | \<item>         | Yes       | SHNG item to monitor for presence |


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
| MotionDetected | \<item>         | Yes       | SHNG item to monitor for motion |


#### Example:
```json
{
    "type": "MotionSensor",
    "name": "Movement hallway",
    "MotionDetected": "EG.Flur.Bewegung"
}
```

### Contact sensor
This sensor shows the open / closed state of a contact (door, window, generic ...).

#### Characteristics in addition to [common characteristics](#common-accessories-characteristics) 
| Parameter    | Possible values | Mandatory | Description                      |
|:-------------|:----------------|:----------|:---------------------------------|
| ContactState | \<item>         | Yes       | SHNG item to monitor for contact |


#### Example:
```json
{
    "type": "ContactSensor",
    "name": "Window kitchen",
    "ContactState": "EG.Kueche.Fenster"
}
```

### Switch
This accessory can monitor and change the on/off state of something. It is very similar to an outlet.

#### Characteristics in addition to [common characteristics](#common-accessories-characteristics) 
| Parameter | Possible values | Mandatory | Description                             |
|:----------|:----------------|:----------|:----------------------------------------|
| On        | \<item>         | Yes       | SHNG item to switch something on or off |


#### Example:
```json
{
    "type": "Switch",
    "name": "Music living-room",
    "On": "EG.Stube.Radio"
}
```

### Outlet
This accessory can monitor and change the on/off state of a wall outlet. The outlet can be generic, a light, a fan, ...

#### Characteristics in addition to [common characteristics](#common-accessories-characteristics) 
| Parameter | Possible values | Mandatory | Description                          |
|:----------|:----------------|:----------|:-------------------------------------|
| On        | \<item>         | Yes       | SHNG item to switch outlet on or off |


#### Example:
```json
{
    "type": "Outlet",
    "name": "Christmas tree",
    "On": "EG.Esszimmer.Steckdose"
}
```

### Security system
This accessory can pilote your intrusion security system. That system can be a physical one operated via SHNG, or a SHNG native logic.

#### Characteristics in addition to [common characteristics](#common-accessories-characteristics) 
| Parameter    | Possible values | Mandatory | Description                                      |
|:-------------|:----------------|:----------|:-------------------------------------------------|
| CurrentState | \<item>         | Yes       | SHNG item to monitor for the current alarm state |
| TargetState  | \<item>         | Yes       | SHNG item to set or get the target state         |

#### Additional comments
Valid values for 'CurrentState':
* STAY_ARM = 0
* AWAY_ARM = 1
* NIGHT_ARM = 2
* DISARMED = 3
* ALARM_TRIGGERED = 4

Valid values for 'TargetState':
* STAY_ARM = 0
* AWAY_ARM = 1
* NIGHT_ARM = 2
* DISARMED = 3

#### Example:
```json
{
    "type": "SecuritySystem",
    "name": "Intrusion alarm",
    "currentState": "Technik.Alarmanlage.Status.Ist",
    "targetState": "Technik.Alarmanlage.Status.Soll"
}
```

### Temperature sensor
This sensor show the actual temperature.

#### Characteristics in addition to [common characteristics](#common-accessories-characteristics) 
| Parameter          | Possible values | Mandatory | Description                          |
|:-------------------|:----------------|:----------|:-------------------------------------|
| CurrentTemperature | \<item>         | Yes       | SHNG item to monitor for temperature |


#### Example:
```json
{
    "type": "TemperatureSensor",
    "name": "Temperature WC",
    "CurrentTemperature": "EG.WC.Temperatur"
}
```

### Thermostat
This sensor shows and sets the actual temperature. In addition it can show the actual heating / cooling state.

#### Characteristics in addition to [common characteristics](#common-accessories-characteristics) 
| Parameter                  | Possible values | Mandatory | Description                                              |
|:---------------------------|:----------------|:----------|:---------------------------------------------------------|
| CurrentTemperature         | \<item>         | Yes       | SHNG item to monitor for temperature                     |
| TargetTemperature          | \<item>         | Yes       | SHNG item to set target temperature                      |
| CurrentHeatingCoolingState | \<item>         | Yes       | SHNG item to monitor for current heating / cooling state |

#### Additional comments
CurrentHeatingCoolingState = 0 for OFF, 1 for HEAT and 2 for COOL

#### Example:
```json
{
    "type": "Thermostat",
    "name": "Temperature badroom",
    "CurrentTemperature": "OG.SZSS.Temperatur",
    "TargetTemperature": "OG.SZSS.Temperatur.Sollwert",
    "CurrentHeatingCoolingState": "OG.SZSS.Temperatur.Status"
}
```

### Window covering
This accessory type can be used for shutters or blinds. Because the differnce between HomeKit and the controlling technology, for example KNX, can be significant this accessory has a lot of parameters. Luckily most are optional.

#### Characteristics in addition to [common characteristics](#common-accessories-characteristics) 
| Parameter                  | Possible values | Mandatory | Default | Description                                                       |
|:---------------------------|:----------------|:----------|:--------|:------------------------------------------------------------------|
| CurrentPosition            | \<item>         | Yes       |         | SHNG item to monitor thecurrent position                          |       
| TargetPosition             | \<item>         | Yes       |         | SHNG item to monitor and set the target position                  |
| CurrentPositionMin         | \<number>       | No        | 0       | Your device's minimum value for current position                  |
| CurrentPositionMax         | \<number>       | No        | 100     | Your device's maximum value for current position                  |
| CurrentPositionInverted    | \<boolean>      | No        | false   | Should the values be inverted, ex: 0 for Homekit = 100 for device |
| TargetPositionMin          | \<number>       | No        | 0       | Your device's minimum value for target position                   |
| TargetPositionMax          | \<number>       | No        | 100     | Your device's maximum value for target position                   |
| TargetPositionInverted     | \<boolean>      | No        | false   | Should the values be inverted, ex: 0 for Homekit = 100 for device |
| CurrentHorizontalTiltAngle | \<item>         | No        |         | SHNG item to monitor current horizontal tilt angle                |       
| TargetHorizontalTiltAngle  | \<item>         | No        |         | SHNG item to monitor and set the target horizontal tilt angle     |
| CurrentVerticalTiltAngle   | \<item>         | No        |         | SHNG item to monitor current vertical tilt angle                  |       
| TargetVerticalTiltAngle    | \<item>         | No        |         | SHNG item to monitor and set the target vertical tilt angle       |


#### Additional comments
HomeKit works with values between 0 and 100 where 0 is completely closed and 100 is open.  
My KNX installation, as example, needs values between 0 and 255 where 255 is completely closed and 0 is open.  
The above optional parameters allow you to specify the neede range for your device. If needed the values can be inverted at the same time. The plugin then transposes the values in both directions.

#### Example (for use with most KNX shutters):
```json
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
```

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

