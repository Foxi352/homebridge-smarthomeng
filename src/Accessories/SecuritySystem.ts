import {
    AccessoryPlugin,
    CharacteristicValue,
    Service,
    Nullable,
} from 'homebridge';

import { SmartHomeNGPlatform } from '../platform';

export class SecuritySystem implements AccessoryPlugin {
    private readonly deviceService: Service;
    private readonly informationService: Service;

    public name: string;
    private currentState = this.platform.Characteristic.SecuritySystemCurrentState.DISARMED;
    private targetState = this.platform.Characteristic.SecuritySystemTargetState.DISARM;

    constructor(private readonly platform: SmartHomeNGPlatform, private readonly accessory) {
        this.name = accessory.name;
        this.deviceService = new this.platform.Service.SecuritySystem(accessory.name);


        // create handlers for required characteristics
        this.deviceService.getCharacteristic(this.platform.Characteristic.SecuritySystemCurrentState)
            .onGet(this.handleSecuritySystemCurrentStateGet.bind(this));

        this.deviceService.getCharacteristic(this.platform.Characteristic.SecuritySystemTargetState)
            .onGet(this.handleSecuritySystemTargetStateGet.bind(this))
            .onSet(this.handleSecuritySystemTargetStateSet.bind(this));

        this.informationService =
            new this.platform.Service.AccessoryInformation()
                .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.manufacturer)
                .setCharacteristic(this.platform.Characteristic.Model, accessory.model)
                .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.currentstate);

        this.platform.shng.addMonitor(accessory.currentstate, this.shngCurrentStateCallback.bind(this));
        this.platform.shng.addMonitor(accessory.targetState, this.shngTargetStateCallback.bind(this));
        this.platform.log.info('SecuritySystem', accessory.name, 'created!');
    }

    identify(): void {
        this.platform.log.info('Identify!');
    }

    getServices(): Service[] {
        return [this.informationService, this.deviceService];
    }

    handleSecuritySystemCurrentStateGet(): Nullable<CharacteristicValue> {
        this.platform.log.info(
            'handleSecuritySystemCurrentStateGet:',
            this.accessory.name, '=',
            this.currentState,
        );
        return this.currentState;
    }

    handleSecuritySystemTargetStateGet(): Nullable<CharacteristicValue> {
        this.platform.log.info(
            'handleSecuritySystemTargetStateGet:', this.accessory.name,
            'is currently', this.targetState,
        );
        return this.targetState;
    }

    handleSecuritySystemTargetStateSet(value: CharacteristicValue) {
        this.targetState = value as number;
        this.platform.log.info('handleSecuritySystemTargetStateSet:', this.accessory.name, 'was set to', this.targetState);
        this.platform.shng.setItem(this.accessory.targetstate, this.targetState);
    }

    shngCurrentStateCallback(value: unknown): void {
        this.platform.log.debug('shngCurrentStateCallback:', this.accessory.name, '=', value, '(' + typeof value + ')');
        if (typeof value === 'number') {
            this.currentState = value;
            this.deviceService.updateCharacteristic(this.platform.Characteristic.SecuritySystemCurrentState, this.currentState);
        } else {
            this.platform.log.warn('Unknown type ', typeof value, 'received for', this.accessory.name + ':', value);
        }
    }

    shngTargetStateCallback(value: unknown): void {
        this.platform.log.debug('shngTargetStateCallback:', this.accessory.name, '=', value, '(' + typeof value + ')');
        if (typeof value === 'number') {
            this.targetState = value;
            this.deviceService.updateCharacteristic(this.platform.Characteristic.SecuritySystemTargetState, this.targetState);
        } else {
            this.platform.log.warn('Unknown type ', typeof value, 'received for', this.accessory.name + ':', value);
        }
    }

}

