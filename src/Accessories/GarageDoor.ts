import {
    AccessoryPlugin,
    CharacteristicValue,
    Service,
    Nullable,
} from 'homebridge';

import { SmartHomeNGPlatform } from '../platform';

export class GarageDoor implements AccessoryPlugin {
    private readonly deviceService: Service;
    private readonly informationService: Service;

    public name: string;
    //private currentPosition = 0; private currentPositionMin = 0; private currentPositionMax = 100; private currentPositionInverted = false;
    //private  = this.platform.Characteristic.PositionState.STOPPED;
    private targetDoorState = this.platform.Characteristic.CurrentDoorState.CLOSED;
    private currentDoorState = this.platform.Characteristic.CurrentDoorState.STOPPED;

    constructor(private readonly platform: SmartHomeNGPlatform, private readonly accessory) {
        this.name = accessory.name;
        this.deviceService = new this.platform.Service.GarageDoorOpener(accessory.name);

        // create handlers for required characteristics
        this.deviceService.getCharacteristic(this.platform.Characteristic.CurrentDoorState)
            .onGet(this.getCurrentDoorState.bind(this))
            .onSet(this.setCurrentDoorState.bind(this));

        this.deviceService.getCharacteristic(this.platform.Characteristic.TargetDoorState)
            .onGet(this.getTargetDoorState.bind(this))
            .onSet(this.setTargetDoorState.bind(this));

        this.informationService =
            new this.platform.Service.AccessoryInformation()
                .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.manufacturer)
                .setCharacteristic(this.platform.Characteristic.Model, accessory.model)
                .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.currentdoorstate); // FIXME

        this.platform.shng.addMonitor(accessory.currentdoorstate, this.shngCurrentDoorStateCallback.bind(this));
        this.platform.shng.addMonitor(accessory.targetdoorstate, this.shngTargetDoorStateCallback.bind(this));
/*
        if (accessory.obstructiondetected) {
            this.platform.shng.addMonitor(accessory.obstructiondetected, this.shngObstructionDetectedCallback.bind(this));
        }
*/
        this.platform.log.info("GarageDoor '%s' created!", accessory.name);
    }

    identify(): void {
        this.platform.log.info('Identify!');
    }

    getServices(): Service[] {
        return [this.informationService, this.deviceService];
    }

    getCurrentDoorState(): Nullable<CharacteristicValue> {
        this.platform.log.info('getCurrentDoorState:', this.accessory.name, 'is currently', this.currentDoorState);
        return this.currentDoorState;
    }

    setCurrentDoorState(value: CharacteristicValue) {
        this.currentDoorState = value as number;
        this.platform.log.info('setCurrentDoorState:', this.accessory.name, 'was set to', this.currentDoorState);
        this.platform.shng.setItem(this.accessory.currentDoorState, this.currentDoorState);
    }

    getTargetDoorState(): Nullable<CharacteristicValue> {
        this.platform.log.info('getTargetDoorState:', this.accessory.name, 'is currently', this.targetDoorState);
        return this.targetDoorState;
    }

    setTargetDoorState(value: CharacteristicValue) {
        this.targetDoorState = value as number;
        this.platform.log.info('setTargetDoorState:', this.accessory.name, 'was set to', this.targetDoorState);
        this.platform.shng.setItem(this.accessory.targetDoorState, this.targetDoorState);
    }

    shngCurrentDoorStateCallback(value: unknown): void {
        this.platform.log.debug('shngCurrentDoorStateCallback:', this.accessory.name, '=', value, '(' + typeof value + ')');
        if (typeof value === 'number') {
            this.currentDoorState = value;
        } else {
            this.platform.log.warn('Unknown type ', typeof value, 'received for', this.accessory.name + ':', value);
        }
    }

    shngTargetDoorStateCallback(value: unknown): void {
        this.platform.log.debug('shngTargetDoorStateCallback:', this.accessory.name, '=', value, '(' + typeof value + ')');
        if (typeof value === 'number') {
            this.targetDoorState = value;
        } else {
            this.platform.log.warn('Unknown type ', typeof value, 'received for', this.accessory.name + ':', value);
        }
    }
}
