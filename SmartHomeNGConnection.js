var http = require("http");
var WebSocketClient = require('websocket').client


function SmartHomeNGConnection(platform, log, host, port) {
  this.log = log;
  this.platform = platform;
  this.connected = false;
  this.updateCallback = undefined;
  this.tomonitor = [];
  
  this.shng_host = host;
  this.shng_port = port;
  
}

SmartHomeNGConnection.prototype.init = function () {
	this.connect();
}

SmartHomeNGConnection.prototype.connect = function(host, ip) {
    var that = this
    this.log("Connecting to SmartHomeNG @ " + this.shng_host);	
  
    this.shng_ws = new WebSocketClient();
  
    this.shng_ws.connect('ws://' + this.shng_host + ':' + this.shng_port + '/');
    this.shng_ws.on('connect', function(connection) {
        that.log('connected to server!'); 
        that.connected = true;
        that.connection = connection;
        that.startMonitoring();
        
        connection.on('message', function(message) { that.receive(message); });	  
		connection.on('error', function(error) { that.log('WebSocket error: ' + error.toString()) });
		connection.on('close', function() {
    	   that.log('Connection to smarthome lost');
    	   that.connected = false;
        });
		
	});

}

SmartHomeNGConnection.prototype.receive = function(message) {
	var msg = JSON.parse(message.utf8Data); 
    //this.log(msg);
    if (msg.items) {
        for (int = 0; int < msg.items.length; int++) {
            item = msg.items[int];
            //this.log("Received value " + item[1] + " for item " + item[0]);
            if (this.updateCallback) {
                this.updateCallback(item[0], item[1]);
            }
        }
    }
}

SmartHomeNGConnection.prototype.setValue = function(item, value) {
    if (this.connected) {
        this.connection.send('{"cmd":"item","id":"' + item + '","val":"' + value + '"}')
    } else {
        this.log("Cannot switch " + item + ", no connection to SmartHomeNG !")
    }
}

SmartHomeNGConnection.prototype.startMonitoring = function() {   
    if (this.connected && this.tomonitor.length > 0) {
        var buffer = {};
        this.log("Start monitoring " + this.tomonitor);
        buffer.cmd = 'monitor';
        buffer.items = this.tomonitor;
        var command = JSON.stringify(buffer);
        this.connection.send(command);
    } else {
        this.log("Cannot start monitoring, not connected !");
    }
}

module.exports = {
  SmartHomeNGConnection: SmartHomeNGConnection
}

