import {
    AccessoryPlugin,
    CharacteristicValue,
    Service,
    Nullable,
} from 'homebridge';

import { SmartHomeNGPlatform } from '../platform';

export class MotionSensor implements AccessoryPlugin {
    private readonly deviceService: Service;
    private readonly informationService: Service;

    public name: string;
    private motionDetected = false;

    constructor(private readonly platform: SmartHomeNGPlatform, private readonly accessory) {
        this.name = accessory.name;
        this.deviceService = new this.platform.Service.MotionSensor(accessory.name);

        // create handlers for required characteristics
        this.deviceService.getCharacteristic(this.platform.Characteristic.MotionDetected)
            .onGet(this.handleMotionDetectedGet.bind(this));

        this.informationService =
            new this.platform.Service.AccessoryInformation()
                .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.manufacturer)
                .setCharacteristic(this.platform.Characteristic.Model, accessory.model)
                .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.motiondetected);

        this.platform.shng.addMonitor(accessory.motiondetected, this.shngCallback.bind(this));
        this.platform.log.info('MotionSensor', accessory.name, 'created!');
    }

    identify(): void {
        this.platform.log.info('Identify!');
    }

    getServices(): Service[] {
        return [this.informationService, this.deviceService];
    }

    handleMotionDetectedGet(): Nullable<CharacteristicValue> {
        this.platform.log.debug('handleMotionDetectedGet:', this.accessory.name, '=', this.motionDetected ? 'True' : 'False');
        return this.motionDetected;
    }

    shngCallback(value: unknown): void {
        this.platform.log.debug('shngCallback:', this.accessory.name, '=', value, '(' + typeof value + ')');
        if (typeof value === 'boolean') {
            this.motionDetected = value;
        } else {
            this.platform.log.warn('Unknown type', typeof value, 'received for', this.accessory.name + ':', value);
        }
        this.deviceService.updateCharacteristic(this.platform.Characteristic.MotionDetected, this.motionDetected);
    }
}


