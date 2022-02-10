import {
    AccessoryPlugin,
    CharacteristicValue,
    Service,
    Nullable,
} from 'homebridge';

import { SmartHomeNGPlatform } from '../platform';

export class Doorbell implements AccessoryPlugin {
    private readonly deviceService: Service;
    private readonly informationService: Service;

    public name: string;
    //private event = this.platform.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS;

    constructor(private readonly platform: SmartHomeNGPlatform, private readonly accessory) {
        this.name = accessory.name;
        this.deviceService = new this.platform.Service.Doorbell(accessory.name);

        // create handlers for required characteristics
        this.deviceService.getCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent)
            .onGet(this.handleProgrammableSwitchEventGet.bind(this));

        this.informationService =
            new this.platform.Service.AccessoryInformation()
                .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.manufacturer)
                .setCharacteristic(this.platform.Characteristic.Model, accessory.model)
                .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.singlepress);

        this.platform.shng.addMonitor(accessory.singlepress, this.shngSinglePressCallback.bind(this));
        this.platform.log.info('Doorbell', accessory.name, 'created!');
    }

    identify(): void {
        this.platform.log.info('Identify!');
    }

    getServices(): Service[] {
        return [this.informationService, this.deviceService];
    }

    handleProgrammableSwitchEventGet(): Nullable<CharacteristicValue> {
        this.platform.log.error(
            'handleProgrammableSwitchEventGet:',
            this.accessory.name, '=',
            0,
        );
        return 0;
    }

    shngSinglePressCallback(value: unknown): void {
        this.platform.log.debug('shngSinglePressCallback:', this.accessory.name, '=', value, '(' + typeof value + ')');
        if (typeof value === 'boolean') {
            if (value) {
                this.deviceService.updateCharacteristic(
                    this.platform.Characteristic.ProgrammableSwitchEvent,
                    this.platform.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS,
                );
            }
        } else {
            this.platform.log.warn('Unknown type', typeof value, 'received for', this.accessory.name + ':', value);
        }
    }
}

