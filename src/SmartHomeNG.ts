import WebSocket from 'ws';
import { SmartHomeNGPlatform } from './platform';


export class SmartHomeNG {
    private ws: WebSocket;
    private tomonitor = {};

    public connected = false;

    constructor(private readonly platform: SmartHomeNGPlatform, private url: string, private autoReconnectInterval = 10) {
        this.platform.log.debug('SHNG constructor');
    }

    connect() {
        this.ws = new WebSocket(this.url);
        this.ws.on('open', () => {
            this.platform.log.info('Connected to SmartHomeNG on', this.url);
            this.connected = true;
            this.identifyMyself();
            this.startMonitoring();
        });

        this.ws.on('message', (data: string) => {
            this.receive(data);
        });

        this.ws.on('error', (error) => {
            this.platform.log.error('WebSocket error: ' + error.toString());
        });

        this.ws.on('close', (code: number) => {
            this.platform.log.warn('Lost connection (Code: ' + code + '). Reconnecting in', this.autoReconnectInterval, 'seconds.');
            this.connected = false;
            if (this.autoReconnectInterval > 0) {
                this.reconnect();
            }
        });
    }

    reconnect() {
        this.ws.removeAllListeners();
        setTimeout(() => {
            this.platform.log.info('WebSocketClient: reconnecting...');
            this.connect();
        }, this.autoReconnectInterval * 1000);
    }

    identifyMyself(): void {
        const protocol = { 'cmd': 'proto', 'ver': 4 };
        const identify = { 'cmd': 'identity', 'sw': 'homebridge-smarthomeng', 'ver': '2.0' };

        this.send(protocol);
        this.send(identify);
    }

    addMonitor(item: string, callback: (value: unknown) => void): void {
        if (item !== null && item !== 'undefined') {
            this.tomonitor[item] = callback;
        }
    }

    startMonitoring(): void {
        const itemlist: string[] = [];
        for (const item in this.tomonitor) {
            itemlist.push(item);
        }
        if (itemlist.length > 0) {
            this.platform.log.info('Start monitoring ' + itemlist);
            const buffer = {
                'cmd': 'monitor',
                'items': itemlist,
            };
            this.send(buffer);
        } else {
            this.platform.log.warn('No need to start monitoring because no items are defined !');
        }

    }

    setItem(item: string, value: unknown): void {
        this.platform.log.info('Sending value', value, 'for', item);
        const command = { 'cmd': 'item', 'id': item, 'val': value };
        this.send(command);
    }

    send(buffer: unknown): boolean {
        const command = JSON.stringify(buffer);
        if (this.connected) {
            this.platform.log.debug('WS: sending:', command);
            this.ws.send(command);
            return true;
        } else {
            this.platform.log.warn('Error sending command !');
            return false;
        }
    }

    receive(data: string): void {
        const msg = JSON.parse(data);
        this.platform.log.debug('WS: received: %s', data);

        if (msg.cmd === 'item' && msg.items) {
            for (const item of msg.items) {
                const name = item[0];
                const value = item[1];
                if (name in this.tomonitor) {
                    const callback = this.tomonitor[name];
                    this.platform.log.info('Received value', value, 'for', name, 'callback', callback);
                    callback(value);
                } else {
                    this.platform.log.debug('Ignoring unmonitored item', name);
                }
            }
        }
    }
}
