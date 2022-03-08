import {
    AccessoryPlugin,
    CharacteristicValue,
    Service,
    Nullable,
} from 'homebridge';

import { SmartHomeNGPlatform } from '../platform';

export class HumiditySensor implements AccessoryPlugin {
    private readonly deviceService: Service;
    private readonly informationService: Service;

    public name: string;
    private currentHumidity = 0;

    constructor(private readonly platform: SmartHomeNGPlatform, private readonly accessory) {
        this.name = accessory.name;
        this.deviceService = new this.platform.Service.HumiditySensor(accessory.name);

        // create handlers for required characteristics
        this.deviceService.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
            .onGet(this.getCurrentHumidity.bind(this));

        this.informationService =
            new this.platform.Service.AccessoryInformation()
                .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.manufacturer)
                .setCharacteristic(this.platform.Characteristic.Model, accessory.model)
                .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.currenthumidity);

        this.platform.shng.addMonitor(accessory.currenthumidity, this.shngCallback.bind(this));
        this.platform.log.info('HumiditySensor', accessory.name, 'created!');
    }

    identify(): void {
        this.platform.log.info('Identify!');
    }

    getServices(): Service[] {
        return [this.informationService, this.deviceService];
    }

    getCurrentHumidity(): Nullable<CharacteristicValue> {
        this.platform.log.debug('getCurrentHumidity:', this.accessory.name, '=', this.currentHumidity);
        return this.currentHumidity;
    }

    shngCallback(value: unknown): void {
        this.platform.log.debug('shngCallback:', this.accessory.name, '=', value, '(' + typeof value + ')');
        if (typeof value === 'number') {
            this.currentHumidity = value;
        } else {
            this.platform.log.warn('Unknown type', typeof value, 'received for', this.accessory.name + ':', value);
        }
        this.deviceService.updateCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity, this.currentHumidity);
    }
}


