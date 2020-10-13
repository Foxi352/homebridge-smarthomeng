var http = require("http");
var WebSocketClient = require('websocket').client

var colorOn = "\x1b[30;47m";
var colorOff = "\x1b[0m";

function SmartHomeNGConnection(platform, log, host, port) {
    this.log = log;
    this.platform = platform;
    this.connected = false;
    this.updateCallback = undefined;
    this.tomonitor = [];
    this.retryTimer = 10;

    this.shng_host = host;
    this.shng_port = port;
}

SmartHomeNGConnection.prototype.init = function () {
    var that = this;
    this.shng_ws = new WebSocketClient();
    this.shng_ws.on('connect', function(connection) {
        that.log('[SmartHomeNGConnection] connected to server!');
        that.connected = true;
        that.connection = connection;
        that.idenfityMyself();
        that.startMonitoring();

        connection.on('message', function(message) { that.receive(message); });
        connection.on('error', function(error) {
            that.log(colorOn + '[SmartHomeNGConnection] WebSocket error: ' + error.toString() + colorOff)
        });
        connection.on('close', function(code, description) {
           that.log(colorOn + '[SmartHomeNGConnection] Connection to smarthome lost, retrying in ' + that.retryTimer + ' seconds. ' + description + colorOff);
           that.connected = false;
           setTimeout(that.connect.bind(that), that.retryTimer * 1000);
        });

    });

    this.shng_ws.on('connectFailed', function(errorDescription) {
        that.connected = false;
        that.log(colorOn + '[SmartHomeNGConnection] Connection error, retrying in ' + that.retryTimer + ' seconds. ' + errorDescription + colorOff);
        setTimeout(that.connect.bind(that), that.retryTimer * 1000);
    });

	this.connect();
}

SmartHomeNGConnection.prototype.connect = function(host, ip) {
    this.log("[SmartHomeNGConnection] Connecting to SmartHomeNG @ " + this.shng_host);
    this.shng_ws.connect('ws://' + this.shng_host + ':' + this.shng_port + '/');

}

SmartHomeNGConnection.prototype.receive = function(message) {
    var msg = JSON.parse(message.utf8Data);
    //this.log(msg);
    if (msg.items) {
        for (int = 0; int < msg.items.length; int++) {
            item = msg.items[int];
            //this.log("[SmartHomeNGConnection] Received value " + item[1] + " for item " + item[0]);
            if (this.updateCallback) {
                this.updateCallback(item[0], item[1]);
            }
        }
    }
}

SmartHomeNGConnection.prototype.setValue = function(item, value) {
    var command = '{"cmd":"item","id":"' + item + '","val":"' + value + '"}';
    if (this.connected) {
        this.log("[SmartHomeNGConnection] Sending " + command + " to SmartHomeNG");
        this.connection.send(command)
    } else {
        this.log("[SmartHomeNGConnection] Cannot switch " + item + ", no connection to SmartHomeNG !")
    }
}

SmartHomeNGConnection.prototype.idenfityMyself = function() {
    if (this.connected) {
        var buffer = {};
        buffer.cmd = 'identity';
        buffer.sw = 'homebridge-SmarHomeNG';
        buffer.ver = this.platform.version;
        var command = JSON.stringify(buffer);
        this.connection.send(command);
    } else {
        this.log("[SmartHomeNGConnection] Cannot identify myself, not connected !");
    }
}

SmartHomeNGConnection.prototype.startMonitoring = function() {
    if (this.connected && this.tomonitor.length > 0) {
        var buffer = {};
        this.log("[SmartHomeNGConnection] Start monitoring " + this.tomonitor);
        buffer.cmd = 'monitor';
        buffer.items = this.tomonitor;
        var command = JSON.stringify(buffer);
        this.connection.send(command);
    } else {
        this.log("[SmartHomeNGConnection] Cannot start monitoring, not connected !");
    }
}

module.exports = {
    SmartHomeNGConnection: SmartHomeNGConnection
}

