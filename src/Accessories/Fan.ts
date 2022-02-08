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

    constructor(private readonly platform: SmartHomeNGPlatform, private readonly accessory) {
        this.name = accessory.name;
        this.deviceService = new this.platform.Service.Fanv2(accessory.name);

        // create handlers for required characteristics
        this.deviceService.getCharacteristic(this.platform.Characteristic.Active)
            .onGet(this.getActive.bind(this))
            .onSet(this.setActive.bind(this));

        this.informationService =
            new this.platform.Service.AccessoryInformation()
                .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.manufacturer)
                .setCharacteristic(this.platform.Characteristic.Model, accessory.model)
                .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.active);

        this.platform.shng.addMonitor(accessory.active, this.shngCallback.bind(this));
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

    shngCallback(value: unknown): void {
        this.platform.log.debug('shngCallback:', this.accessory.name, '=', value, '(' + typeof value + ')');
        if (typeof value === 'boolean') {
            this.active = value;
            this.deviceService.updateCharacteristic(this.platform.Characteristic.Active, this.active);
        } else {
            this.platform.log.warn('Unknown type ', typeof value, 'received for', this.accessory.name + ':', value);
        }
    }
}
