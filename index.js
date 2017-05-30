/*****
 * SmartHomeNG platform shim for use with nfarina's homebridge plugin system 
 * This work has been inspired by the homebridge-knx platform shim. Credits to snowdd1 !
 * 
 */

var Accessory, Service, Characteristic, UUIDGen;
var fs = require('fs');
var path = require('path');

var SmartHomeNGConnection =  require("./SmartHomeNGConnection.js").SmartHomeNGConnection;
var milliTimeout = 300; // used to block responses while swiping
var monitoring = [];
var colorOn = "\x1b[30;47m";
var colorOff = "\x1b[0m";

module.exports = function(homebridge) {
    // Accessory must be created from PlatformAccessory Constructor
    Accessory = homebridge.platformAccessory;

    // Service and Characteristic are from hap-nodejs
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;
  
    homebridge.registerPlatform("homebridge-smarthomeng", "SmartHomeNG", SmartHomeNGPlatform);
}

// Platform constructor
function SmartHomeNGPlatform(log, config, api) {
    this.log = log;
    this.config = config;
    this.accessoriesCache = [];
    this.supportedFunctions = ['onoff', 'brightness', 'hue', 'saturation', 'currentposition', 'targetposition', 'motiondetected'];
  
    if (this.config["host"] != undefined) {
        this.shng_host = this.config["host"];
    } else {
        this.shng_host = "localhost";
    }
  
    if (this.config["port"] != undefined) {
        this.shng_port = this.config["port"];
    } else {
        this.shng_port = 2424;
    }
  
  var that = this;
  this.version = this.getVersion();
  this.log("SmartHomeNG Platform Plugin Version " + this.version)

  this.shngcon = new SmartHomeNGConnection(this, this.log, this.shng_host, this.shng_port);
  this.shngcon.updateCallback = this.update;
  
    if (api) {
        this.api = api;
        this.api.on('didFinishLaunching', function() {
        this.log("Finished loading " + this.accessoriesCache.length + " accessories");
        // this.log(monitoring);
        // Add supported SHNG items to monitoring
        var tomonitor = [];
        for(i = 0; i < monitoring.length; i++) {
            var device = monitoring[i];
            if(tomonitor.indexOf(device.item) == -1) {
                tomonitor.push(device.item);
            }  
        }
        this.shngcon.tomonitor = tomonitor;
      }.bind(this));
    }
    this.shngcon.init();
}

// Accessory constructor
function SmartHomeNGAccessory(log, config, shngcon) {
    this.name = config.name;
    this.config = config;
    this.log = log;
    this.shngcon = shngcon;
    this.value = undefined;
    this.manufacturername = 'SmartHomeNG';
    /*this.log("CONSTRUCTOR: ");
    this.log(device);
    this.log("------")*/
}

SmartHomeNGPlatform.prototype = {
    
    // Return our accessories to homebridge
    accessories: function(callback) {
        var that = this;
        var foundAccessories = [];
        
        this.log("Building list of accessories");
     
        var configAccessories = this.config.accessories;
        for (var i = 0; i < configAccessories.length; i++) {
            this.log("Parsing accessory: '" + configAccessories[i].name + "'.");
            
            var accessory = new SmartHomeNGAccessory(that.log, configAccessories[i], that.shngcon);
            foundAccessories.push(accessory);
        }
        
        //this.log(foundAccessories)
        this.accessoriesCache = foundAccessories;
        callback(foundAccessories);
    },
     
    update: function (item, value) {
        //this.log("CALLBACK: item " + item + " with value " + value);
        for (var i = 0; i < monitoring.length; i++) {
        // iterate through all registered addresses
            if (monitoring[i].item == item) {
                this.log("[" + monitoring[i].name + "] Got update for '" + monitoring[i].characteristic + "' from SmartHomeNG item '" + item + "' with value " + value + ".");
                monitoring[i].lastValue = value;
                monitoring[i].callback(item, value, monitoring[i].inverted);
            }
        }
    },

    // Get version info from package.json file
    getVersion: function() {
        var pjPath = path.join(__dirname, './package.json');
        var pj = JSON.parse(fs.readFileSync(pjPath));
        return pj.version;
    }
}

SmartHomeNGAccessory.prototype = {
    
    // Enumerate accessory services and characteristics
    getServices: function() {
        var that = this;
        var myServices = [];
        
        this.log("["+ this.name +"] Setting up services.");
        
        // check if device type is set in config
        if (!this.config.type) {
            this.log("Ignoring '" + this.name + "' because no device type found, make sure to have the 'type' parameter in your config.json !");
            return [];
        }

        // construct service and characteristics according to device type
        var serial = "unknown";
        switch (this.config.type.toLowerCase()) {        
            // Lightbulb service
            case 'fan':
                myServices.push(this.getFanService(this.config));
                serial = this.config.onoff;
                break;
                
            case 'temperaturesensor':
                myServices.push(this.getTemperatureSensorService(this.config));
                break;
                
            case 'thermostat':
                myServices.push(this.getThermostatService(this.config));
                break;

            case 'lightbulb':
                myServices.push(this.getLightbulbService(this.config));
                serial = this.config.onoff;
                break;
            
            case 'window':
                myServices.push(this.getWindowService(this.config));
                break;

            case 'switch':
                myServices.push(this.getSwitchService(this.config));
                break;

            case 'windowcovering':
                myServices.push(this.getWindowCoveringService(this.config));
                break;

            case 'occupancysensor':
                myServices.push(this.getOccupancySensorService(this.config));
                serial = this.config.motiondetected;
                break;

            case 'motionsensor':
                myServices.push(this.getMotionSensorService(this.config));
                serial = this.config.motiondetected;
                break;

            case 'contactsensor':
                myServices.push(this.getContactSensorService(this.config));
                serial = this.config.contactsensorstate;
                break;
            
            // If no supported type is found warn user and return empty services
            default:
                this.log("Ignoring '" + this.name + "' because device type '" + this.config.type + "' is not supported !");
                return [];
                break;
        }
        
        // device information service
        var informationService = new Service.AccessoryInformation();
        informationService
            .setCharacteristic(Characteristic.Manufacturer, "Opensource Community")
            .setCharacteristic(Characteristic.Model, "SmartHomeNG device")
            .setCharacteristic(Characteristic.SerialNumber, serial);
        myServices.push(informationService);
       
        return myServices;
    },

    // Respond to identify request
    identify: function(callback) { 
        this.log("Identify request for '" + this.name + "'.");
        callback();
    },

/** Registering routines
 * 
 */
    shngregister_int: function(name, shngitem, characteristic) {
        this.log("[" + name + "] Registering callback for '" + shngitem + "'.");
        var callback = function (shngitem, value) {
            //this.log("[" + this.name + "] callback for " + characteristic.displayName);
            characteristic.setValue(value, undefined, 'fromSHNG');
        }.bind(this);
        monitoring.push({name: name, characteristic: characteristic.displayName, item: shngitem, callback: callback, inverted: false});
    },
    
    shngregister_float: function(name, shngitem, characteristic) {
        this.log("[" + name + "] Registering callback for '" + shngitem + "'.");
        var callback = function (shngitem, value) {
            //this.log("[" + this.name + "] callback for " + characteristic.displayName);
            characteristic.setValue(value, undefined, 'fromSHNG');
        }.bind(this);
        monitoring.push({name: name, characteristic: characteristic.displayName, item: shngitem, callback: callback, inverted: false});
    },

    shngregister_bool: function(name, shngitem, characteristic, inverted) {
        this.log("[" + name + "] Registering callback for '" + shngitem + "'.");
        var callback = function (shngitem, value, inverted) {
            //this.log("[" + this.name + "] callback for " + characteristic.displayName);
            characteristic.setValue(value ? (inverted ? 0:1) : (inverted ? 1:0), undefined, 'fromSHNG');
        }.bind(this);
        monitoring.push({name: name, characteristic: characteristic.displayName, item: shngitem, callback: callback, inverted: inverted});
    },
    
    shngregister_percent: function(name, shngitem, characteristic, inverted) {
        this.log("[" + name + "] Registering callback for '" + shngitem + "'.");
        var callback = function (shngitem, value, inverted) {
            //this.log("[" + this.name + "] callback for " + characteristic.displayName + " with value " + value);
            characteristic.setValue(inverted ? 100 - value : value, undefined, 'fromSHNG');
        }.bind(this);
        monitoring.push({name: name, characteristic: characteristic.displayName, item: shngitem, callback: callback, inverted: inverted});
    },
 
    shngregister_angle: function(name, shngitem, characteristic, inverted) {
        this.log("[" + name + "] Registering callback for '" + shngitem + "'.");
        var callback = function (shngitem, value, inverted) {
            //this.log("[" + this.name + "] callback for " + characteristic.displayName);
            value = value * 3.6;
            characteristic.setValue(inverted ? 100 - value : value, undefined, 'fromSHNG');
        }.bind(this);
        monitoring.push({name: name, characteristic: characteristic.displayName, item: shngitem, callback: callback, inverted: inverted});
    },
 
 /** get methods
 *
 */
    getState: function(callback, shngitem, inverted) {
        this.log("[" + this.name + "] Get value from cache for item " + shngitem + ".");
        for (var i = 0; i < monitoring.length; i++) {
            if (monitoring[i].item == shngitem) {
                if (monitoring[i].lastValue != undefined) {
                    value = monitoring[i].lastValue;
                    this.log("[" + this.name + "] Found value " + value + " in cache.");
                    //monitoring[i].callback(item, value, monitoring[i].inverted);
                    callback(null, value);
                    return;
                }
                break;
            }
        }
        callback();
    },

/** set methods used for creating callbacks
 *
 */
    setBooleanState: function(value, callback, context, shngitem, inverted) {
        if (context === 'fromSHNG') {
            if (callback) {
                callback();
            }
        } else {
            var numericValue = inverted ? 1:0;
            if (value) {
                numericValue = inverted ? 0:1;
            }
            this.log("[" + this.name + "] Setting " + shngitem + (inverted ? " (inverted)":"") + " boolean to %s", numericValue);
            this.shngcon.setValue(shngitem, numericValue);
            if (callback) callback();
        }
    },
    
    setPercentage: function(value, callback, context, shngitem, inverted) {
        if (context === 'fromSHNG') {
            if (callback) {
                callback();
            }
        } else {      
            var numericValue = 0;
            value = ( value>=0 ? (value<=100 ? value:100):0 ); //ensure range 0..100
            if (inverted) {
                numericValue = 100  - value; 
            } else {
                numericValue = value;
            }
            this.log("[" + this.name + "] Setting " + shngitem + " percentage to %s", numericValue);
            this.shngcon.setValue(shngitem, numericValue);
            if (callback) callback();
        }
    },

    setAngle: function(value, callback, context, shngitem, inverted) {
        if (context === 'fromSHNG') {
            if (callback) {
                callback();
            }
        } else {      
            var numericValue = 0;
            value = ( value>=0 ? (value<=360 ? value:360):0 ); //ensure range 0..360
            if (inverted) {
                numericValue = 360  - value; 
            } else {
                numericValue = value;
            }
            this.log("[" + this.name + "] Setting " + shngitem + " percentage to %s", numericValue);

            numericValue = numericValue / 3.6; //convert Angle to Percentage (0-100)

            this.shngcon.setValue(shngitem, numericValue);
            if (callback) callback();
        }
    },

    setInt: function(value, callback, context, shngitem) {
    	if (context === 'fromSHNG') {
    		if (callback) {
    			callback();
    		}
    	} else {	  
    		var numericValue = 0;
    		if (value && value>=0) {
    			numericValue = value; 
    		}
    		this.log("["+ this.name +"] Setting " + shngitem + " int to %s", numericValue);
            this.shngcon.setValue(shngitem, numericValue);
            if (callback) callback();
    	}
    },

    setFloat: function(value, callback, context, shngitem) {
    	if (context === 'fromSHNG') {
    		if (callback) {
    			callback();
    		}
    	} else {	  
    		var numericValue = 0;
    		if (value && value>=0) {
    			numericValue = value; 
    		}
    		this.log("["+ this.name +"] Setting " + shngitem + " float to %s", numericValue);
            this.shngcon.setValue(shngitem, numericValue);
            if (callback) callback();
    	}
    },
        
/** bindCharacteristic
 *  initializes callbacks for 'set' events (from HK) and for SmartHomeNG monitoring events (to HK)
 */    
    // Bind characteristic to service during startup
    bindCharacteristic: function(myService, characteristicType, valueType, shngitem, inverted, defaultValue) {
        var myCharacteristic = myService.getCharacteristic(characteristicType);
        //this.log("SHNGITEM: " + shngitem)
        if (defaultValue) {
            myCharacteristic.setValue(defaultValue);
        }
        switch (valueType) {
            case "Int":
                myCharacteristic.on('set', function(value, callback, context) {
                    this.setInt(value, callback, context, shngitem);
                }.bind(this));
                myCharacteristic.on('get', function(callback, context) {
                    this.getState(callback, shngitem, inverted);
                }.bind(this));
                this.shngregister_int(this.name, shngitem, myCharacteristic);
                break; 
            case "Float":
                myCharacteristic.on('set', function(value, callback, context) {
                    this.setFloat(value, callback, context, shngitem);
                }.bind(this));
                myCharacteristic.on('get', function(callback, context) {
                    this.getState(callback, shngitem, inverted);
                }.bind(this));
                this.shngregister_float(this.name, shngitem, myCharacteristic);
                break; 
            case "Bool":
                myCharacteristic.on('set', function(value, callback, context) {
                    this.setBooleanState(value, callback, context, shngitem, inverted);
                }.bind(this));
                myCharacteristic.on('get', function(callback, context) {
                    this.getState(callback, shngitem, inverted);
                }.bind(this));
                this.shngregister_bool(this.name, shngitem, myCharacteristic, inverted);
                break; 
            case "Percent":
                myCharacteristic.on('set', function(value, callback, context) {
                    this.setPercentage(value, callback, context, shngitem, inverted);
                    //myCharacteristic.timeout = Date.now()+milliTimeout;
                }.bind(this));  
                myCharacteristic.on('get', function(callback, context) {
                    this.getState(callback, shngitem, inverted);
                }.bind(this));
                this.shngregister_percent(this.name, shngitem, myCharacteristic, inverted);
                break;
            case "Angle":
                myCharacteristic.on('set', function(value, callback, context) {
                    this.setAngle(value, callback, context, shngitem, inverted);
                    //myCharacteristic.timeout = Date.now()+milliTimeout;
                }.bind(this));  
                myCharacteristic.on('get', function(callback, context) {
                    this.getState(callback, shngitem, inverted);
                }.bind(this));
                this.shngregister_angle(this.name, shngitem, myCharacteristic, inverted);
                break;
            default:
                this.log(colorOn + "[ERROR] unknown type passed: [" + valueType+"]"+ colorOff);
        } 
        return myCharacteristic;
    },

/**
 *  function getXXXXXXXService(config)
 *  returns a configured service object to the caller (accessory/device)
 *
 */   
    // Create Temperature Sensor service
    getTemperatureSensorService: function(config) {
        var myService = new Service.TemperatureSensor(config.name,config.name);
        // Current temperature
        if (config.currenttemperature) {
            this.log("["+ this.name +"] TemperatureSensor CurrentTemperature characteristic enabled");
            this.bindCharacteristic(myService, Characteristic.CurrentTemperature, "Float", config.currenttemperature, false);
        }
        return myService;
    },

    // Create Thermostat service
    getThermostatService: function(config) {
        var myService = new Service.Thermostat(config.name,config.name);

        // Current temperature
        if (config.currenttemperature) {
            this.log("["+ this.name +"] TemperatureSensor CurrentTemperature characteristic enabled");
            this.bindCharacteristic(myService, Characteristic.CurrentTemperature, "Float", config.currenttemperature, false);
        }
        // Target temperature
        if (config.targettemperature) {
            this.log("["+ this.name +"] TemperatureSensor TargetTemperature characteristic enabled");
			myService.getCharacteristic(Characteristic.TargetTemperature).setProps({
				minValue: config.targettemperatureminimum || 0,
				maxValue: config.targettemperaturemaximum || 40
			});
            this.bindCharacteristic(myService, Characteristic.TargetTemperature, "Float", config.targettemperature, false);
        }
        /*
        if (config.temperaturedisplayunits && config.temperaturedisplayunits.toLowerCase() == 'fahrenheit') {
            this.bindCharacteristic(myService, Characteristic.TemperatureDisplayUnits, "Int", Characteristic.TemperatureDisplayUnits.FAHRENHEIT, false);
        } else {
            this.bindCharacteristic(myService, Characteristic.TemperatureDisplayUnits, "Int", Characteristic.TemperatureDisplayUnits.CELSIUS, false);
        }*/
        return myService;
    },
    
    // Create Fan service
    getFanService: function(config) {
        var myService = new Service.Fan(config.name,config.name);
        var inverted = false;
        if (config.inverted) {
            inverted = true;
        }
        // On (and Off)
        if (config.onoff) {
            this.log("["+ this.name +"] Fan on/off characteristic enabled");
            this.bindCharacteristic(myService, Characteristic.On, "Bool", config.onoff, inverted);
        }
        return myService;
    },
    
    // Create Lightbulb service
    getLightbulbService: function(config) {
        var myService = new Service.Lightbulb(config.name,config.name);
        var inverted = false;
        if (config.inverted) {
            inverted = true;
        }
        // On (and Off)
        if (config.onoff) {
            this.log("["+ this.name +"] Lightbulb on/off characteristic enabled");
            this.bindCharacteristic(myService, Characteristic.On, "Bool", config.onoff, inverted);
        }
        // Brightness if available
        if (config.brightness) {
            this.log("["+ this.name +"] Lightbulb Brightness characteristic enabled");
            myService.addCharacteristic(Characteristic.Brightness); // it's an optional
            this.bindCharacteristic(myService, Characteristic.Brightness, "Percent", config.brightness, inverted);
        }
        // Hue if available
        if (config.hue) {
            this.log("["+ this.name +"] Lightbulb Hue characteristic enabled");
            myService.addCharacteristic(Characteristic.Hue); // it's an optional
            this.bindCharacteristic(myService, Characteristic.Hue, "Angle", config.hue, inverted);
        }
        // Saturation if available
        if (config.saturation) {
            this.log("["+ this.name +"] Lightbulb Saturation characteristic enabled");
            myService.addCharacteristic(Characteristic.Saturation); // it's an optional
            this.bindCharacteristic(myService, Characteristic.Saturation, "Percent", config.saturation, inverted);
        }
        return myService;
    },
    
    // Create Window service
    getWindowService: function(config) {
        //this.log(config);
        var myService = new Service.Window(config.name,config.name);
        var inverted = false;
        if (config.inverted) {
            inverted = true;
        }
        if (config.currentposition) {
            this.log("["+ this.name +"] Window CurrentPosition characteristic enabled");
            this.bindCharacteristic(myService, Characteristic.CurrentPosition, "Percent", config.currentposition, inverted);
        } 
        if (config.targetposition) {
            this.log("["+ this.name +"] Window TargetPosition characteristic enabled");
            this.bindCharacteristic(myService, Characteristic.TargetPosition, "Percent", config.targetposition, inverted);
        } 
        this.log("["+ this.name +"] Window PositionState characteristic enabled");
        this.bindCharacteristic(myService, Characteristic.PositionState, "Int", config.positionstate, inverted, Characteristic.PositionState.STOPPED);
        return myService;
    },

    // Create WindowCovering service
    getWindowCoveringService: function(config) {
        //this.log(config);
        var myService = new Service.WindowCovering(config.name,config.name);
        var inverted = false;
        if (config.inverted) {
            inverted = true;
        }
        if (config.currentposition) {
            this.log("["+ this.name +"] WindowCovering CurrentPosition characteristic enabled");
            this.bindCharacteristic(myService, Characteristic.CurrentPosition, "Percent", config.currentposition, inverted);
        } 
        if (config.targetposition) {
            this.log("["+ this.name +"] WindowCovering TargetPosition characteristic enabled");
            this.bindCharacteristic(myService, Characteristic.TargetPosition, "Percent", config.targetposition, inverted);
        } 
        this.log("["+ this.name +"] WindowCovering PositionState characteristic enabled");
        this.bindCharacteristic(myService, Characteristic.PositionState, "Int", config.positionstate, inverted, Characteristic.PositionState.STOPPED);
        return myService;
    },
    
    // Create OccupancySensor service
    getOccupancySensorService: function(config) {
        var myService = new Service.OccupancySensor(config.name,config.name);
        var inverted = false;
        if (config.inverted) {
            inverted = true;
        }
        if (config.motiondetected) {
            this.log("["+ this.name +"] OccupancySensor OccupancyDetected characteristic enabled");
            this.bindCharacteristic(myService, Characteristic.OccupancyDetected, "Bool", config.motiondetected, inverted);
        } 
        return myService;
    },

    // Create MotionSensor service
    getMotionSensorService: function(config) {
        var myService = new Service.MotionSensor(config.name,config.name);
        var inverted = false;
        if (config.inverted) {
            inverted = true;
        }
        if (config.motiondetected) {
            this.log("["+ this.name +"] MotionSensor MotionDetected characteristic enabled");
            this.bindCharacteristic(myService, Characteristic.MotionDetected, "Bool", config.motiondetected, inverted);
        } 
        return myService;
    },
        
    // Create ContactSensor service
    getContactSensorService: function(config) {
        var myService = new Service.ContactSensor(config.name,config.name);
        var inverted = false;
        if (config.inverted) {
            inverted = true;
        }
        if (config.contactsensorstate) {
            this.log("["+ this.name +"] ContactSensor ContactSensorState characteristic enabled");
            this.bindCharacteristic(myService, Characteristic.ContactSensorState, "Bool", config.contactsensorstate, inverted);
        } 
        return myService;
    },

    // Create Switch service
    getSwitchService: function(config) {
        var myService = new Service.Switch(config.name,config.name);
        var inverted = false;
        if (config.inverted) {
            inverted = true;
        }
        // On (and Off)
        if (config.onoff) {
            this.log("["+ this.name +"] Switch on/off characteristic enabled");
            this.bindCharacteristic(myService, Characteristic.On, "Bool", config.onoff, inverted);
        }
        return myService;
    },

}
