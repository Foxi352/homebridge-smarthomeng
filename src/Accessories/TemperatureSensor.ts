import {
    AccessoryPlugin,
    CharacteristicValue,
    Service,
    Nullable,
} from 'homebridge';

import { SmartHomeNGPlatform } from '../platform';

export class TemperatureSensor implements AccessoryPlugin {
    private readonly deviceService: Service;
    private readonly informationService: Service;

    public name: string;
    private currentTemperature = 0;

    constructor(private readonly platform: SmartHomeNGPlatform, private readonly accessory) {
        this.name = accessory.name;
        this.deviceService = new this.platform.Service.TemperatureSensor(accessory.name);

        // create handlers for required characteristics
        this.deviceService.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
            .onGet(this.getCurrentTemperature.bind(this));

        this.informationService =
            new this.platform.Service.AccessoryInformation()
                .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.manufacturer)
                .setCharacteristic(this.platform.Characteristic.Model, accessory.model)
                .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.currenttemperature);

        this.platform.shng.addMonitor(accessory.currenttemperature, this.shngCallback.bind(this));
        this.platform.log.info('TemperatureSensor', accessory.name, 'created!');
    }

    identify(): void {
        this.platform.log.info('Identify!');
    }

    getServices(): Service[] {
        return [this.informationService, this.deviceService];
    }

    getCurrentTemperature(): Nullable<CharacteristicValue> {
        this.platform.log.debug('getCurrentTemperature:', this.accessory.name, '=', this.currentTemperature);
        return this.currentTemperature;
    }

    shngCallback(value: unknown): void {
        this.platform.log.debug('shngCallback:', this.accessory.name, '=', value, '(' + typeof value + ')');
        if (typeof value === 'number') {
            this.currentTemperature = value;
        } else {
            this.platform.log.warn('Unknown type', typeof value, 'received for', this.accessory.name + ':', value);
        }
        this.deviceService.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, this.currentTemperature);
    }
}


