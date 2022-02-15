import {
    AccessoryPlugin,
    CharacteristicValue,
    Service,
    Nullable,
} from 'homebridge';

import { SmartHomeNGPlatform } from '../platform';

export class WindowCovering implements AccessoryPlugin {
    private readonly deviceService: Service;
    private readonly informationService: Service;

    public name: string;
    private currentPosition = 0; private currentPositionMin = 0; private currentPositionMax = 100; private currentPositionInverted = false;
    private targetPosition = 0; private targetPositionMin = 0; private targetPositionMax = 100; private targetPositionInverted = false;
    private positionState = this.platform.Characteristic.PositionState.STOPPED;
    private currentHorizontalTiltAngle = 0; private targetHorizontalTiltAngle = 0;
    private currentVerticalTiltAngle = 0; private targetVerticalTiltAngle = 0;

    constructor(private readonly platform: SmartHomeNGPlatform, private readonly accessory) {
        this.name = accessory.name;
        this.deviceService = new this.platform.Service.WindowCovering(accessory.name);

        // create handlers for required characteristics
        this.deviceService.getCharacteristic(this.platform.Characteristic.CurrentPosition)
            .onGet(this.getCurrentPosition.bind(this));

        this.deviceService.getCharacteristic(this.platform.Characteristic.TargetPosition)
            .onGet(this.getTargetPosition.bind(this))
            .onSet(this.setTargetPosition.bind(this));

        this.deviceService.getCharacteristic(this.platform.Characteristic.CurrentHorizontalTiltAngle)
            .onGet(this.getCurrentHorizontalTiltAngle.bind(this));

        this.deviceService.getCharacteristic(this.platform.Characteristic.TargetHorizontalTiltAngle)
            .onGet(this.getTargetHorizontalTiltAngle.bind(this))
            .onSet(this.setTargetHorizontalTiltAngle.bind(this));

        this.deviceService.getCharacteristic(this.platform.Characteristic.CurrentVerticalTiltAngle)
            .onGet(this.getCurrentVerticalTiltAngle.bind(this));

        this.deviceService.getCharacteristic(this.platform.Characteristic.TargetVerticalTiltAngle)
            .onGet(this.getTargetVerticalTiltAngle.bind(this))
            .onSet(this.setTargetVerticalTiltAngle.bind(this));

        this.deviceService.getCharacteristic(this.platform.Characteristic.PositionState)
            .onGet(this.getPositionState.bind(this));

        this.informationService =
            new this.platform.Service.AccessoryInformation()
                .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.manufacturer)
                .setCharacteristic(this.platform.Characteristic.Model, accessory.model)
                .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.currentposition);

        this.platform.shng.addMonitor(accessory.currentposition, this.shngCurrentPositionCallback.bind(this));
        this.platform.shng.addMonitor(accessory.targetposition, this.shngTargetPositionCallback.bind(this));
        if (accessory.currenthorizontaltiltangle) {
            this.platform.shng.addMonitor(accessory.currenthorizontaltiltangle, this.shngCurrentHorizontalTiltAngleCallback.bind(this));
        }
        if (accessory.targethorizontaltiltangle) {
            this.platform.shng.addMonitor(accessory.targethorizontaltiltangle, this.shngTargetHorizontalTiltAngleCallback.bind(this));
        }
        if (accessory.currentverticaltiltangle) {
            this.platform.shng.addMonitor(accessory.currentverticaltiltangle, this.shngCurrentVerticalTiltAngleCallback.bind(this));
        }
        if (accessory.targetverticaltiltangle) {
            this.platform.shng.addMonitor(accessory.targetverticaltiltangle, this.shngTargetVerticalTiltAngleCallback.bind(this));
        }

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
        this.platform.log.info('setTargetPosition:', this.accessory.name, 'was set to', this.targetPosition);
        const transposedTarget = this.convertRange(
            value as number,
            0, 100,
            this.targetPositionMin, this.targetPositionMax,
            this.targetPositionInverted,
        );
        this.platform.shng.setItem(this.accessory.targetposition, transposedTarget);
    }

    getCurrentHorizontalTiltAngle(): Nullable<CharacteristicValue> {
        this.platform.log.info('getCurrentHorizontalTiltAngle:', this.accessory.name, 'is currently', this.currentHorizontalTiltAngle);
        return this.currentHorizontalTiltAngle;
    }

    getTargetHorizontalTiltAngle(): Nullable<CharacteristicValue> {
        this.platform.log.info('getTargetHorizontalTiltAngle:', this.accessory.name, 'is currently', this.targetHorizontalTiltAngle);
        return this.targetHorizontalTiltAngle;
    }

    setTargetHorizontalTiltAngle(value: CharacteristicValue) {
        this.targetHorizontalTiltAngle = value as number;
        this.platform.log.info('setTargetHorizontalTiltAngle:', this.accessory.name, 'was set to', this.targetHorizontalTiltAngle);
        this.platform.shng.setItem(this.accessory.targethorizontaltiltangle, this.targetHorizontalTiltAngle);
    }

    getCurrentVerticalTiltAngle(): Nullable<CharacteristicValue> {
        this.platform.log.info('getCurrentVerticalTiltAngle:', this.accessory.name, 'is currently', this.currentVerticalTiltAngle);
        return this.currentVerticalTiltAngle;
    }

    getTargetVerticalTiltAngle(): Nullable<CharacteristicValue> {
        this.platform.log.info('getTargetVerticalTiltAngle:', this.accessory.name, 'is currently', this.targetVerticalTiltAngle);
        return this.targetVerticalTiltAngle;
    }

    setTargetVerticalTiltAngle(value: CharacteristicValue) {
        this.targetVerticalTiltAngle = value as number;
        this.platform.log.info('setTargetVerticalTiltAngle:', this.accessory.name, 'was set to', this.targetVerticalTiltAngle);
        this.platform.shng.setItem(this.accessory.targetverticaltiltangle, this.targetVerticalTiltAngle);
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


    shngCurrentHorizontalTiltAngleCallback(value: unknown): void {
        this.platform.log.debug('shngCurrentHorizontalTiltAngleCallback:', this.accessory.name, '=', value, '(' + typeof value + ')');
        if (typeof value === 'number') {
            this.currentHorizontalTiltAngle = value;
        } else {
            this.platform.log.warn('Unknown type ', typeof value, 'received for', this.accessory.name + ':', value);
        }
    }

    shngTargetHorizontalTiltAngleCallback(value: unknown): void {
        this.platform.log.debug('shngTargetHorizontalTiltAngleCallback:', this.accessory.name, '=', value, '(' + typeof value + ')');
        if (typeof value === 'number') {
            this.targetHorizontalTiltAngle = value;
        } else {
            this.platform.log.warn('Unknown type ', typeof value, 'received for', this.accessory.name + ':', value);
        }
    }

    shngCurrentVerticalTiltAngleCallback(value: unknown): void {
        this.platform.log.debug('shngCurrentVerticalTiltAngleCallback:', this.accessory.name, '=', value, '(' + typeof value + ')');
        if (typeof value === 'number') {
            this.currentVerticalTiltAngle = value;
        } else {
            this.platform.log.warn('Unknown type ', typeof value, 'received for', this.accessory.name + ':', value);
        }
    }

    shngTargetVerticalTiltAngleCallback(value: unknown): void {
        this.platform.log.debug('shngTargetVerticalTiltAngleCallback:', this.accessory.name, '=', value, '(' + typeof value + ')');
        if (typeof value === 'number') {
            this.targetVerticalTiltAngle = value;
        } else {
            this.platform.log.warn('Unknown type ', typeof value, 'received for', this.accessory.name + ':', value);
        }
    }

    updateDirection() {
        let direction;
        if (this.targetPosition < this.currentPosition) {
            direction = 'DECREASING';
            this.positionState = this.platform.Characteristic.PositionState.DECREASING;
        } else if (this.targetPosition > this.currentPosition) {
            direction = 'INCREASING';
            this.positionState = this.platform.Characteristic.PositionState.INCREASING;
        } else {
            direction = 'STOPPED';
            this.positionState = this.platform.Characteristic.PositionState.STOPPED;
        }
        this.platform.log.debug(
            'updateDirection for', this.accessory.name,
            ': current =', this.currentPosition,
            'target =', this.targetPosition,
            'direction:', direction,
        );
    }

    convertRange(value: number, oldmin: number, oldmax: number, newmin: number, newmax: number, inverted: boolean): number {
        let result = (((value - oldmin) * (newmax - newmin)) / (oldmax - oldmin)) + newmin;
        result = Math.round(result);
        if (inverted) {
            result = newmax - result;
        }
        this.platform.log.debug(
            'Transposing', value,
            'from range', oldmin, '-', oldmax,
            'to', newmin, '-', newmax,
            'with inverted', inverted,
            '=', result,
        );
        return result;
    }
}
