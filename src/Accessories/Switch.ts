import {
    AccessoryPlugin,
    CharacteristicValue,
    Service,
    Nullable,
} from 'homebridge';

import { SmartHomeNGPlatform } from '../platform';

export class Switch implements AccessoryPlugin {
    private readonly deviceService: Service;
    private readonly informationService: Service;

    public name: string;
    private switchOn = false;

    constructor(private readonly platform: SmartHomeNGPlatform, private readonly accessory) {
        this.name = accessory.name;
        this.deviceService = new this.platform.Service.Switch(accessory.name);

        // create handlers for required characteristics
        this.deviceService.getCharacteristic(this.platform.Characteristic.On)
            .onGet(this.getOn.bind(this))
            .onSet(this.setOn.bind(this));

        this.informationService =
            new this.platform.Service.AccessoryInformation()
                .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.manufacturer)
                .setCharacteristic(this.platform.Characteristic.Model, accessory.model)
                .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.onoff);

        this.platform.shng.addMonitor(accessory.onoff, this.shngCallback.bind(this));
        this.platform.log.info("Switch '%s' created!", accessory.name);
    }

    identify(): void {
        this.platform.log.info('Identify!');
    }

    getServices(): Service[] {
        return [this.informationService, this.deviceService];
    }

    getOn(): Nullable<CharacteristicValue> {
        this.platform.log.info('GetOn:', this.accessory.name, 'is currently', (this.switchOn ? 'ON' : 'OFF'));
        return this.switchOn;
    }

    setOn(value: CharacteristicValue) {
        this.switchOn = value as boolean;
        this.platform.log.info('SetOn:', this.accessory.name, 'was set to', (this.switchOn ? 'ON' : 'OFF'));
        this.platform.shng.setItem(this.accessory.onoff, this.switchOn);
    }

    shngCallback(value: unknown): void {
        this.platform.log.debug('shngCallback:', this.accessory.name, '=', value, '(' + typeof value + ')');
        if (typeof value === 'boolean') {
            this.switchOn = value;
            this.deviceService.updateCharacteristic(this.platform.Characteristic.On, this.switchOn);
        } else {
            this.platform.log.warn('Unknown type ', typeof value, 'received for', this.accessory.name + ':', value);
        }
    }
}
