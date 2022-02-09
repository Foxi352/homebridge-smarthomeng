import {
    AccessoryPlugin,
    CharacteristicValue,
    Service,
    Nullable,
} from 'homebridge';

import { SmartHomeNGPlatform } from '../platform';

export class ContactSensor implements AccessoryPlugin {
    private readonly deviceService: Service;
    private readonly informationService: Service;

    public name: string;
    private contactState = this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;

    constructor(private readonly platform: SmartHomeNGPlatform, private readonly accessory) {
        this.name = accessory.name;
        this.deviceService = new this.platform.Service.ContactSensor(accessory.name);

        // create handlers for required characteristics
        this.deviceService.getCharacteristic(this.platform.Characteristic.MotionDetected)
            .onGet(this.handleContactSensorStateGet.bind(this));

        this.informationService =
            new this.platform.Service.AccessoryInformation()
                .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.manufacturer)
                .setCharacteristic(this.platform.Characteristic.Model, accessory.model)
                .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.contactstate);

        this.platform.shng.addMonitor(accessory.contactstate, this.shngCallback.bind(this));
        this.platform.log.info('ContactSensor', accessory.name, 'created!');
    }

    identify(): void {
        this.platform.log.info('Identify!');
    }

    getServices(): Service[] {
        return [this.informationService, this.deviceService];
    }

    handleContactSensorStateGet(): Nullable<CharacteristicValue> {
        this.platform.log.debug(
            'handleContactSensorStateGet:',
            this.accessory.name, '=',
            this.contactState === this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED ? 'True' : 'False',
        );
        return this.contactState;
    }

    shngCallback(value: unknown): void {
        this.platform.log.debug('shngCallback:', this.accessory.name, '=', value, '(' + typeof value + ')');
        if (typeof value === 'boolean') {
            if (value) {
                this.contactState = this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED;
            } else {
                this.contactState = this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
            }
        } else {
            this.platform.log.warn('Unknown type', typeof value, 'received for', this.accessory.name + ':', value);
        }
        this.deviceService.updateCharacteristic(this.platform.Characteristic.ContactSensorState, this.contactState);
    }
}

