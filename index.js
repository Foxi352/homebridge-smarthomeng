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
    this.supportedFunctions = ['onoff', 'brightness'];
  
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
 
      // Listen to event "didFinishLaunching", this means homebridge already finished loading cached accessories
      // Platform Plugin should only register new accessory that doesn't exist in homebridge after this event.
      // Or start discover new accessories
      this.api.on('didFinishLaunching', function() {
        this.log("Finished loading " + this.accessoriesCache.length + " accessories");
        // Add supported SHNG items to monitoring
        var tomonitor = [];
        for(i = 0; i < this.accessoriesCache.length; i++) {
            var device = this.accessoriesCache[i].device;
            for (var key in device) {
                if (this.supportedFunctions.indexOf(key) >= 0) {
                    tomonitor.push(device[key]);
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
        this.accessoriesCounter = foundAccessories.length;
        this.accessoriesCache = foundAccessories;
        callback(foundAccessories);
    },
     
    update: function (item, value) {
        //this.log("CALLBACK: item " + item + " with value " + value);
        for (i = 0; i < this.platform.accessoriesCache.length; i++) {
            accessory = this.platform.accessoriesCache[i].device;
            // loop through accessories and services to find modified one
            for (var key in accessory) {
                if (accessory[key] == item) {
                    this.log("Updating item '" + item + "' with value " + value);
                    accessory[key + '_value'] = value;
                    break;
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
    
        return [informationService, myService];
    },

    // Get value
    getValue: function(characteristic, callback) {
        this.log("Get value for " + this.device.name + ", characteristic: " + characteristic + ".");
        //this.log(this.device);
        if (this.device[characteristic + "_value"] != undefined) {
            this.log("Found value '" + this.device[characteristic + "_value"] + "' for '" + characteristic + "' of device '" + this.device.name + "'.");
            if (callback) callback(null, this.device[characteristic + "_value"]);
        } else {
            if (callback) callback("Oh oh :-(");
        }
        
    },

    // Set value
    setValue: function(characteristic, value, callback) {
        this.log("Set " + this.device.name + ", characteristic: " + characteristic + ", value: " + value + ".");
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
    }
}
