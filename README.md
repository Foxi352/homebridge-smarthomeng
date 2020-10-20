# homebridge-smarthomeng
Homebridge plugin for SmartHomeNG. This is work in progress and not all devices are supported yet.

## Currently supported
This plugin currently supports the following services (and characteristics):

* LightBulb (on/off, brightness, hue, saturation)
* Fan (on/off)
* Temperature sensor (current temperature)
* Thermostat (current- / target temperature)
* Window (current- / target position)
* Window Covering (current- / target position)
* Motion sensor (motion detected)
* Occupancy sensor (motion detected)
* Contact Sensor (contact state)
* Switch (on/off)

## Requirements
* [SmartHomeNG](https://github.com/smarthomeNG/smarthome)
* [homebridge](https://www.npmjs.com/package/homebridge)

## Installation
### Install nodejs >= 0.12.
You have to find out the right way for your OS. 


Debian Jessie:

	curl -sL https://deb.nodesource.com/setup_4.x | sudo bash -
	sudo apt-get install -y nodejs

Alpine Linux: (--no-cache example is for building a docker image)

	apk --no-cache add nodejs

### Install libavahi-compat-libdnssd-dev lib
Debian Jessie:

	sudo apt-get install libavahi-compat-libdnssd-dev

Alpine Linux: (--no-cache example is for building a docker image)

	apk --no-cache add dbus nodejs avahi avahi-compat-libdns_sd avahi-dev

### Install homebridge from NPM repository

	npm install -g homebridge --unsafe-perm


### Install this plugin from NPM repository

	npm install -g homebridge-smarthomeng --unsafe-perm


## Configuration
You have to create a config.json in .homebridge directory. You'll find that directory in your home folder. This is an example config file which just uses this plugin and some example SmartHomeNG items.

{
    "bridge": {
        "name": "HBDEV",
        "username": "CC:22:3D:E3:DE:37",
        "port": 51826,
        "pin": "031-45-154"
    },

    "platforms": [
        {
            "platform": "SmartHomeNG",
             
            "name": "SmartHomeNG",
            "host": "srvsmarthome.ha.swa.lu",
            "accessories": [
                {
                    "name": "Temperatur Stube",
                    "type": "TemperatureSensor",
                    "currenttemperature": "EG.Stube.Temperatur"
                },
                {
                    "name": "Heizung Bad",
                    "type": "Thermostat",
                    "currenttemperature": "OG.Bad.Temperatur",
                    "targettemperature": "OG.Bad.Temperatur.Sollwert",
                    "targettemperatureminimum": 18,
                    "targettemperaturemaximum": 25
                },                
                {
                    "name": "Ventilator Bad",
                    "type": "Fan",
                    "onoff": "OG.Bad.Ventilator"
                },
                {
                    "name": "Lüftung",
                    "type": "Fan",
                    "onoff": "EG.Lüftung"
                    "rotationSpeed": "EG.LüftungSpeed"
                },
                {
                    "name": "Schalter",
                    "type": "Switch",
                    "onoff": "EG.Esszimmer.Schalter"
                },
                {
                    "name": "Schaltsteckdose",
                    "type": "Outlet",
                    "onoff": "EG.Esszimmer.Steckdose"
                },
                {
                    "name": "Bürolicht",
                    "type": "Lightbulb",
                    "onoff": "EG.Buero.Licht"
                },
                {
                    "name": "Stubenlicht",
                    "type": "Lightbulb",
                    "onoff": "EG.Stube.Licht"
                },
                {
                    "name": "Schlafzimmerlicht",
                    "type": "Lightbulb",
                    "onoff": "OG.SZSS.Licht",
                    "brightness": "OG.SZSS.Licht.dimmen"
                },
                {
                    "name": "Rolladen Büro",
                    "type": "WindowCovering",
                    "updown": "EG.Buero.Rolladen.AufAb",
                    "currentposition": "EG.Buero.Rolladen.Position",
                    "targetposition": "EG.Buero.Rolladen.Position",
                    "inverted": true
                },
                {
                    "name": "Bewegungsmelder Küche",
                    "type": "MotionSensor",
                    "motionstate": "EG.Kueche.Praesenz"
                },
                {
                    "name": "Terassentür Küche",
                    "type": "ContactSensor",
                    "contactsensorstate": "EG.Kueche.Tuer",
                    "inverted": true
                },
                {
                    "name": "Fenster Esszimmer",
                    "type": "ContactSensor",
                    "contactsensorstate": "EG.Esszimmer.Fenster",
                    "inverted": true
                },
                {
                    "name": "Präsenzsmelder Esszimmer",
                    "type": "OccupancySensor",
                    "motiondetected": "EG.Esszimmer.Praesenz"
                }

            ]
        }
    ],

    "description": "This is my development config file."

}

