// SmartHomeNG Platform Shim for HomeBridge

var Accessory, Service, Characteristic, UUIDGen;
var fs = require('fs');
var path = require('path');
var SmartHomeNGConnection =  require("./SmartHomeNGConnection.js").SmartHomeNGConnection;

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
    this.supportedFunctions = ['onoff', 'brightness', 'currentposition', 'targetposition'];
  
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
  
  var that = this
  this.log("SmartHomeNG Platform Plugin Version " + this.getVersion())

  this.shngcon = new SmartHomeNGConnection(this, this.log, this.shng_host, this.shng_port);
  this.shngcon.updateCallback = this.update;
  
  if (api) {
      this.api = api;
      this.api.on('didFinishLaunching', function() {
        this.log("Finished loading " + this.accessoriesCache.length + " accessories");
        // Add supported SHNG items to monitoring
        var tomonitor = [];
        for(i = 0; i < this.accessoriesCache.length; i++) {
            var device = this.accessoriesCache[i].device;
            for (var key in device) {
                if (this.supportedFunctions.indexOf(key) >= 0) {
                    if(tomonitor.indexOf(device[key]) == -1) {
                        tomonitor.push(device[key]);
                    }  
                }
            }
        }
        this.shngcon.tomonitor = tomonitor;
      }.bind(this));
  }

  this.shngcon.init();
}

// Accessory constructor
function SmartHomeNGAccessory(log, device, shngcon) {
    this.name = device.name;
    this.device = device;
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
        for (i = 0; i < this.platform.accessoriesCache.length; i++) {
            accessory = this.platform.accessoriesCache[i];
            //this.log(this.platform);
            // loop through accessories and services to find modified one
            for (var key in accessory.device) {
                if (accessory.device[key] == item) {
                    var myValue = value;
                    if (accessory.device.type == 'WindowCovering' && accessory.device.inverted) {
                        myValue = 100 - value;
                    }
                    this.log("Updating item '" + item + "' characteristic " + key + " with value " + myValue);
                    accessory.device[key + '_value'] = myValue;
                    myCharacteristic = Characteristic.On;
                    //accessory.getService(Service.Lightbulb).getCharacteristic(myCharacteristic).setValue(value);
                    //this.log(this);
                    // var myService = accessory.getService(Service.Lightbulb)
                    // var myCharacteristic = myService.getCharacteristic(characteristicType);
                    // Characteristic.On - Characteristic.Brightness
                    // myCharacteristic.setValue(defaultValue);
                    //break;
                }
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
        this.log("Setting services for '" + this.name + "'");
        
        // check if device type is set in config
        if (!this.device.type) {
            this.log("Ignoring '" + this.name + "' because no device type found, make sure to have the 'type' parameter in your config.json !");
            return [];
        }

        // construct service and characteristics according to device type
        switch (this.device.type.toLowerCase()) {
            
            // Lightbulb service
            case 'lightbulb':
                var myService = new Service.Lightbulb(this.name);
                // On / Off characteristic
                if (this.device.onoff) {
                    this.log("Adding on/off characteristic to " + this.name);
                    
                    myService
                        .getCharacteristic(Characteristic.On)
                        .on('get', function(callback) { that.getValue("onoff", callback);})
                        .on('set', function(value, callback) { that.setValue("onoff", value, callback);});
                }
                // Dimmable characteristic
                if (this.device.brightness) {
                    this.log("Adding brightness characteristic to " + this.name);
                    myService
                        .addCharacteristic(Characteristic.Brightness)
                        .on('get', function(callback) { that.getValue("brightness", callback);})
                        .on('set', function(value, callback) { that.setValue("brightness", value, callback);});
                }
                break;
            
            case 'windowcovering':
                var myService = new Service.WindowCovering(this.name);
                // Current position characteristic
                if (this.device.currentposition) {
                    this.log("Adding 'CurrentPosition' characteristic to " + this.name);     
                    myService
                        .getCharacteristic(Characteristic.CurrentPosition)
                        .on('get', function(callback) { that.getValue("currentposition", callback);});
                }
                // Target position characteristic
                if (this.device.targetposition) {
                    this.log("Adding 'TargetPosition' characteristic to " + this.name);     
                    myService
                        .getCharacteristic(Characteristic.TargetPosition)
                        .on('get', function(callback) { that.getValue("targetposition", callback);})
                        .on('set', function(value, callback) { that.setValue("targetposition", value, callback);});

                    this.log("Adding 'PositionState' characteristic to " + this.name);     
                    myService
                        .getCharacteristic(Characteristic.PositionState)
                        .on('get', function(callback) { that.getValue("positionstate", callback);})
                        .setValue(1);
                    this.device.positionstate_value = 2;
                }
                break;
            
            // If no supported type is found warn user and return empty services
            default:
                this.log("Ignoring '" + this.name + "' because device type '" + this.device.type + "' is not supported !");
                return [];
                break;
        }
        
        // device information service
        var informationService = new Service.AccessoryInformation();
        informationService
            .setCharacteristic(Characteristic.Manufacturer, this.manufacturername)
            .setCharacteristic(Characteristic.Model, this.model)
            .setCharacteristic(Characteristic.SerialNumber, this.device.uniqueid);
        MyServices = [informationService, myService];
        //this.toto = MyServices;
        return MyServices;
    },

    // Get value
    getValue: function(characteristic, callback) {
        this.log("Get value for " + this.device.name + ", characteristic: " + characteristic + ".");
        this.log(this.device);
        //if (characteristic == 'CurrentPosition') { characteristic = 'position'};
        this.log("Looking for " + characteristic + "_value");
        if (this.device[characteristic + "_value"] != undefined) {
            this.log("Found value '" + this.device[characteristic + "_value"] + "' for '" + characteristic + "' of device '" + this.device.name + "'.");
            if (callback) callback(null, this.device[characteristic + "_value"]);
        } else {
            if (callback) callback();
        }
        
    },

    // Set value
    setValue: function(characteristic, value, callback) {
        this.log("Set " + this.device.name + ", characteristic: " + characteristic + ", value: " + value + ".");

        // some special treatment for shutters
        if (this.device.type == 'WindowCovering') {
            if (characteristic == 'targetposition') {
                // if 0% or 100% use open / close actions if available
                if(this.device.updown != undefined && (value == 0 || value == 100)) {
                    characteristic = 'updown';                   
                    if(value == 100) value = 0;
                    else value = 1;
                }
                // For HomeKit 0% is closed. User can invert this beheavior as KNX for example is the opposite.
                if (this.device.inverted) {
                    value = 100 - value;
                } 
            } 
        }


        // If item for characteristic exists then send value to it
        if (this.device[characteristic] != undefined) {
            this.shngcon.setValue(this.device[characteristic], value);
        }
        // Check if callback required
        if (callback) callback(); // Success
        callback = null;
    },
      
    // Respond to identify request
    identify: function(callback) { 
        this.log("Identify request for '" + this.device.name + "'.");
        callback();
    }
}
