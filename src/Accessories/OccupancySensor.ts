import {
    AccessoryPlugin,
    CharacteristicValue,
    Service,
    Nullable,
} from 'homebridge';

import { SmartHomeNGPlatform } from '../platform';

export class OccupancySensor implements AccessoryPlugin {
    private readonly deviceService: Service;
    private readonly informationService: Service;

    public name: string;
    private occupencyDetected = this.platform.Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED;

    constructor(private readonly platform: SmartHomeNGPlatform, private readonly accessory) {
        this.name = accessory.name;
        this.deviceService = new this.platform.Service.OccupancySensor(accessory.name);

        // create handlers for required characteristics
        this.deviceService.getCharacteristic(this.platform.Characteristic.OccupancyDetected)
            .onGet(this.handleOccupancyDetectedGet.bind(this));

        this.informationService =
            new this.platform.Service.AccessoryInformation()
                .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.manufacturer)
                .setCharacteristic(this.platform.Characteristic.Model, accessory.model)
                .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.occupancydetected);

        this.platform.shng.addMonitor(accessory.occupancydetected, this.shngAccupancyDetectedCallback.bind(this));
        this.platform.log.info('OccupancySensor', accessory.name, 'created!');
    }

    identify(): void {
        this.platform.log.info('Identify!');
    }

    getServices(): Service[] {
        return [this.informationService, this.deviceService];
    }

    handleOccupancyDetectedGet(): Nullable<CharacteristicValue> {
        this.platform.log.debug('handleOccupancyDetectedGet:', this.accessory.name, '=', this.occupencyDetected ? 'True' : 'False');
        return this.occupencyDetected;
    }

    shngAccupancyDetectedCallback(value: unknown): void {
        this.platform.log.debug('shngAccupancyDetectedCallback:', this.accessory.name, '=', value, '(' + typeof value + ')');
        if (typeof value === 'boolean') {
            if (value) {
                this.occupencyDetected = this.platform.Characteristic.OccupancyDetected.OCCUPANCY_DETECTED;
            } else {
                this.occupencyDetected = this.platform.Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED;
            }
        } else {
            this.platform.log.warn('Unknown type', typeof value, 'received for', this.accessory.name + ':', value);
        }
        this.deviceService.updateCharacteristic(this.platform.Characteristic.OccupancyDetected, this.occupencyDetected);
    }
}


