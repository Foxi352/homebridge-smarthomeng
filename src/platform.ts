import {
    API,
    StaticPlatformPlugin,
    Logger,
    PlatformConfig,
    AccessoryPlugin,
    Service,
    Characteristic,
} from 'homebridge';
import { SmartHomeNG } from './SmartHomeNG';

import { OccupancySensor } from './Accessories/OccupancySensor';
import { MotionSensor } from './Accessories/MotionSensor';
import { Switch } from './Accessories/Switch';
import { Outlet } from './Accessories/Outlet';
import { Fan } from './Accessories/Fan';
import { Lightbulb } from './Accessories/Lightbulb';
import { TemperatureSensor } from './Accessories/TemperatureSensor';
import { Thermostat } from './Accessories/Thermostat';
import { WindowCovering } from './Accessories/WindowCovering';
import { ContactSensor } from './Accessories/ContactSensor';

function uncapitalizeKeys(obj): Record<string, unknown> {
    function isObject(o: unknown): boolean {
        return Object.prototype.toString.apply(o) === '[object Object]';
    }
    function isArray(o: unknown): boolean {
        return Object.prototype.toString.apply(o) === '[object Array]';
    }

    const transformedObj = isArray(obj) ? [] : {};

    for (const key in obj) {
        const transformedKey = key.toLowerCase();

        if (isObject(obj[key]) || isArray(obj[key])) {
            transformedObj[transformedKey] = uncapitalizeKeys(obj[key]);
        } else {
            transformedObj[transformedKey] = obj[key];
        }
    }
    return transformedObj;
}

export class SmartHomeNGPlatform implements StaticPlatformPlugin {
    public readonly Service: typeof Service = this.api.hap.Service;
    public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
    public shng: SmartHomeNG;

    constructor(
        public readonly log: Logger,
        public readonly config: PlatformConfig,
        public readonly api: API,
    ) {
        log.debug('Using config file', api.user.configPath());
        this.shng = new SmartHomeNG(this, 'ws://smarthome.iot.wagener.family:2424/');

        this.api.on('didFinishLaunching', () => {
            log.debug('Executed didFinishLaunching callback');
            this.shng.connect();
        });
    }

    accessories(callback: (foundAccessories: AccessoryPlugin[]) => void): void {
        this.log.debug('Building accessories list...');
        const devices: AccessoryPlugin[] = [];

        // convert all configured accessory keys to lowercase to tolerate user case errors
        const accessories = JSON.parse(JSON.stringify(uncapitalizeKeys(this.config.accessories)));

        for (const accessory of accessories) {
            if (!accessory.manufacturer) {
                accessory.manufacturer = 'SmartHomeNG';
            }
            if (!accessory.model) {
                accessory.model = 'SHNG Item';
            }

            if (accessory.type !== '') {
                this.log.info('Parsing accessory:', accessory.name, 'of type', accessory.type);
                // set lo lowercase to ignore user case errors
                switch (accessory.type.toLowerCase()) {

                    // Presence sensor
                    case 'occupancysensor':
                        devices.push(new OccupancySensor(this, accessory));
                        break;
                    // Motion sensor
                    case 'motionsensor':
                        devices.push(new MotionSensor(this, accessory));
                        break;

                    // Contact sensor
                    case 'contactsensor':
                        devices.push(new ContactSensor(this, accessory));
                        break;

                    // Switch
                    case 'switch':
                        devices.push(new Switch(this, accessory));
                        break;

                    // Lightbulb
                    case 'lightbulb':
                        devices.push(new Lightbulb(this, accessory));
                        break;

                    // Outlet
                    case 'outlet':
                        devices.push(new Outlet(this, accessory));
                        break;

                    // Fan (uses Fanv2)
                    case 'fan':
                        devices.push(new Fan(this, accessory));
                        break;

                    // TemperatureSensor
                    case 'temperaturesensor':
                        devices.push(new TemperatureSensor(this, accessory));
                        break;

                    // Thermostat
                    case 'thermostat':
                        devices.push(new Thermostat(this, accessory));
                        break;

                    // WindowCovering
                    case 'windowcovering':
                        devices.push(new WindowCovering(this, accessory));
                        break;

                    // Show error for (yet ?) unsupported device
                    default:
                        this.log.warn('Accessory type', accessory.type, 'for', accessory.name, 'not recognized !');
                        break;
                }
            } else {
                this.log.warn('Ignoring accessory (no type given): ' + accessory);
            }
        }
        callback(devices);
        this.log.debug('Finished building accessories list');
    }
}
