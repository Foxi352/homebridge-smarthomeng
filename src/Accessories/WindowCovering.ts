import {
    AccessoryPlugin,
    CharacteristicValue,
    Service,
    Nullable,
} from 'homebridge';
import { setMaxListeners } from 'process';
import { setFlagsFromString } from 'v8';

import { SmartHomeNGPlatform } from '../platform';

export class WindowCovering implements AccessoryPlugin {
    private readonly deviceService: Service;
    private readonly informationService: Service;

    public name: string;
    private currentPosition = 0; private currentPositionMin = 0; private currentPositionMax = 100; private currentPositionInverted = false;
    private targetPosition = 0; private targetPositionMin = 0; private targetPositionMax = 100; private targetPositionInverted = false;
    private positionState = this.platform.Characteristic.PositionState.STOPPED;

    constructor(private readonly platform: SmartHomeNGPlatform, private readonly accessory) {
        this.name = accessory.name;
        this.deviceService = new this.platform.Service.WindowCovering(accessory.name);

        // create handlers for required characteristics
        this.deviceService.getCharacteristic(this.platform.Characteristic.CurrentPosition)
            .onGet(this.getCurrentPosition.bind(this));

        this.deviceService.getCharacteristic(this.platform.Characteristic.TargetPosition)
            .onGet(this.getTargetPosition.bind(this))
            .onSet(this.setTargetPosition.bind(this));

        this.deviceService.getCharacteristic(this.platform.Characteristic.PositionState)
            .onGet(this.getPositionState.bind(this));

        this.informationService =
            new this.platform.Service.AccessoryInformation()
                .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.manufacturer)
                .setCharacteristic(this.platform.Characteristic.Model, accessory.model)
                .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.currentposition);

        this.platform.shng.addMonitor(accessory.currentposition, this.shngCurrentPositionCallback.bind(this));
        this.platform.shng.addMonitor(accessory.targetposition, this.shngTargetPositionCallback.bind(this));

        this.currentPositionMax = accessory.currentpositionmax ? accessory.currentpositionmax : this.currentPositionMax;
        this.currentPositionMin = accessory.currentpositionmin ? accessory.currentpositionmin : this.currentPositionMin;
        this.currentPositionInverted = accessory.currentpositioninverted ? accessory.currentpositioninverted : this.currentPositionInverted;
        this.targetPositionMax = accessory.targetpositionmax ? accessory.targetpositionmax : this.targetPositionMax;
        this.targetPositionMin = accessory.targetpositionmin ? accessory.targetpositionmin : this.targetPositionMin;
        this.targetPositionInverted = accessory.targetpositioninverted ? accessory.targetpositioninverted : this.targetPositionInverted;
        this.platform.log.info("WindowCovering '%s' created!", accessory.name);
    }

    identify(): void {
        this.platform.log.info('Identify!');
    }

    getServices(): Service[] {
        return [this.informationService, this.deviceService];
    }

    getCurrentPosition(): Nullable<CharacteristicValue> {
        this.platform.log.info('getCurrentPosition:', this.accessory.name, 'is currently', this.currentPosition);
        return this.currentPosition;
    }

    getPositionState(): Nullable<CharacteristicValue> {
        this.platform.log.info('getPositionState:', this.accessory.name, 'is currently', this.positionState);
        return this.positionState;
    }

    getTargetPosition(): Nullable<CharacteristicValue> {
        this.platform.log.info('getTargetPosition:', this.accessory.name, 'is currently', this.targetPosition);
        return this.targetPosition;
    }

    setTargetPosition(value: CharacteristicValue) {
        this.targetPosition = value as number;
        this.platform.log.info('SetOn:', this.accessory.name, 'was set to', this.targetPosition);
        const transposedTarget = this.convertRange(
            value as number,
            0, 100,
            this.targetPositionMin, this.targetPositionMax,
            this.targetPositionInverted,
        );
        this.platform.shng.setItem(this.accessory.targetposition, transposedTarget);
    }

    shngCurrentPositionCallback(value: unknown): void {
        this.platform.log.debug('shngCurrentPositionCallback:', this.accessory.name, '=', value, '(' + typeof value + ')');
        if (typeof value === 'number') {
            this.currentPosition = this.convertRange(
                value as number,
                this.currentPositionMin, this.currentPositionMax,
                0, 100,
                this.currentPositionInverted,
            );
            this.deviceService.updateCharacteristic(this.platform.Characteristic.CurrentPosition, this.currentPosition);
        } else {
            this.platform.log.warn('Unknown type ', typeof value, 'received for', this.accessory.name + ':', value);
        }
        this.updateDirection();
    }


    shngTargetPositionCallback(value: unknown): void {
        this.platform.log.debug('shngTargetPositionCallback:', this.accessory.name, '=', value, '(' + typeof value + ')');
        if (typeof value === 'number') {
            this.targetPosition = this.convertRange(
                value as number,
                this.targetPositionMin, this.targetPositionMax,
                0, 100,
                this.targetPositionInverted,
            );
            this.deviceService.updateCharacteristic(this.platform.Characteristic.TargetPosition, this.targetPosition);
        } else {
            this.platform.log.warn('Unknown type ', typeof value, 'received for', this.accessory.name + ':', value);
        }
        this.updateDirection();
    }

    updateDirection() {
        if (this.targetPosition < this.currentPosition) {
            this.positionState = this.platform.Characteristic.PositionState.DECREASING;
        } else if (this.targetPosition > this.currentPosition) {
            this.positionState = this.platform.Characteristic.PositionState.INCREASING;
        } else {
            this.positionState = this.platform.Characteristic.PositionState.STOPPED;
        }
    }

    convertRange(value: number, oldmin: number, oldmax: number, newmin: number, newmax: number, inverted: boolean): number {
        let result = (((value - oldmin) * (newmax - newmin)) / (oldmax - oldmin)) + newmin;
        if (inverted) {
            result = newmax - result;
        }
        this.platform.log.warn(
            'Transposing', value,
            'from range', oldmin, '-', oldmax,
            'to', newmin, '-', newmax,
            'with inverted', inverted,
            '=', result,
        );
        return result;
    }
}
