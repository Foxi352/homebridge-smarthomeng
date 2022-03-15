import { Int16 } from 'hap-nodejs';
import {
    AccessoryPlugin,
    CharacteristicValue,
    Service,
    Nullable,
} from 'homebridge';

import { SmartHomeNGPlatform } from '../platform';

export class Fan implements AccessoryPlugin {
    private readonly deviceService: Service;
    private readonly informationService: Service;

    public name: string;
    private active = false;
    private rotationSpeed = 100;

    constructor(private readonly platform: SmartHomeNGPlatform, private readonly accessory) {
        this.name = accessory.name;
        this.deviceService = new this.platform.Service.Fanv2(accessory.name);

        // create handlers for required characteristics
        this.deviceService.getCharacteristic(this.platform.Characteristic.Active)
            .onGet(this.getActive.bind(this))
            .onSet(this.setActive.bind(this));
        this.platform.shng.addMonitor(accessory.active, this.shngActiveCallback.bind(this));

        if (accessory.rotationspeed) {
            this.deviceService.getCharacteristic(this.platform.Characteristic.RotationSpeed)
                .onGet(this.getRotationSpeed.bind(this))
                .onSet(this.setRotationSpeed.bind(this));
            this.platform.shng.addMonitor(accessory.rotationspeed, this.shngRotationSpeedCallback.bind(this));
        }

        this.informationService =
            new this.platform.Service.AccessoryInformation()
                .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.manufacturer)
                .setCharacteristic(this.platform.Characteristic.Model, accessory.model)
                .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.active);
        this.platform.log.info("Fan '%s' created!", accessory.name);
    }

    identify(): void {
        this.platform.log.info('Identify!');
    }

    getServices(): Service[] {
        return [this.informationService, this.deviceService];
    }

    getActive(): Nullable<CharacteristicValue> {
        this.platform.log.info('getActive:', this.accessory.name, 'is currently', (this.active ? 'ON' : 'OFF'));
        return this.active;
    }

    setActive(value: CharacteristicValue) {
        this.active = value as boolean;
        this.platform.log.info('setActive:', this.accessory.name, 'was set to', (this.active ? 'ON' : 'OFF'));
        this.platform.shng.setItem(this.accessory.active, this.active);
    }

    getRotationSpeed(): Nullable<CharacteristicValue> {
        this.platform.log.info('getRotationSpeed:', this.accessory.name, 'is currently', this.rotationSpeed);
        return this.rotationSpeed;
    }

    setRotationSpeed(value: CharacteristicValue) {
        this.rotationSpeed = value as number;
        this.platform.log.info('setRotationSpeed:', this.accessory.name, 'was set to', this.rotationSpeed);
        this.platform.shng.setItem(this.accessory.rotationspeed, this.rotationSpeed);
    }

    shngActiveCallback(value: unknown): void {
        this.platform.log.debug('shngCallback:', this.accessory.name, '=', value, '(' + typeof value + ')');
        if (typeof value === 'boolean') {
            this.active = value;
            this.deviceService.updateCharacteristic(this.platform.Characteristic.Active, this.active);
        } else {
            this.platform.log.warn('Unknown type ', typeof value, 'received for', this.accessory.name + ':', value);
        }
    }

    shngRotationSpeedCallback(value: unknown): void {
        this.platform.log.debug('shngCallback:', this.accessory.name, '=', value, '(' + typeof value + ')');
        if (typeof value === 'number') {
            this.rotationSpeed = value;
            this.deviceService.updateCharacteristic(this.platform.Characteristic.RotationSpeed, this.rotationSpeed);
        } else {
            this.platform.log.warn('Unknown type ', typeof value, 'received for', this.accessory.name + ':', value);
        }
    }
}
