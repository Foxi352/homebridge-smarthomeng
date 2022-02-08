import {
    AccessoryPlugin,
    CharacteristicValue,
    Service,
    Nullable,
} from 'homebridge';

import { SmartHomeNGPlatform } from '../platform';

export class Thermostat implements AccessoryPlugin {
    private readonly deviceService: Service;
    private readonly informationService: Service;

    public name: string;
    private currentTemperature = 0;
    private targetTemperature = 0;
    private targetTemperatureDisplayUnit = this.platform.Characteristic.TemperatureDisplayUnits.CELSIUS;
    private currentHeatingCoolingState = this.platform.Characteristic.CurrentHeatingCoolingState.OFF;
    private targetHeatingCoolingState = this.platform.Characteristic.TargetHeatingCoolingState.AUTO;

    constructor(private readonly platform: SmartHomeNGPlatform, private readonly accessory) {
        this.name = accessory.name;
        this.deviceService = new this.platform.Service.Thermostat(accessory.name);

        // create handlers for required characteristics
        this.deviceService.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
            .onGet(this.getCurrentTemperature.bind(this));

        this.deviceService.getCharacteristic(this.platform.Characteristic.TargetTemperature)
            .onGet(this.getTargetTemperature.bind(this))
            .onSet(this.setTargetTemperature.bind(this));

        this.deviceService.getCharacteristic(this.platform.Characteristic.TemperatureDisplayUnits)
            .onGet(this.getTemperatureDisplayUnits.bind(this))
            .onSet(this.setTemperatureDisplayUnits.bind(this));

        this.deviceService.getCharacteristic(this.platform.Characteristic.CurrentHeatingCoolingState)
            .onGet(this.getCurrentHeatingCoolingState.bind(this));

        this.deviceService.getCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState)
            .onGet(this.getTargetHeatingCoolingState.bind(this))
            .onSet(this.setTargetHeatingCoolingState.bind(this));

        this.informationService =
            new this.platform.Service.AccessoryInformation()
                .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.manufacturer)
                .setCharacteristic(this.platform.Characteristic.Model, accessory.model)
                .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.currenttemperature);

        // Add items to SHNG WS monitor
        this.platform.shng.addMonitor(accessory.currenttemperature, this.shngCurrentTemperatureCallback.bind(this));
        this.platform.shng.addMonitor(accessory.targettemperature, this.shngTargetTemperatureCallback.bind(this));
        this.platform.shng.addMonitor(accessory.currentheatingcoolingstate, this.shngCurrentHeatingCoolingStateCallback.bind(this));
        // FUTURE: Add monitoring of target Heating / Cooling states amd maybe display units
        this.platform.log.info('Thermostat', accessory.name, 'created!');
    }

    identify(): void {
        this.platform.log.info('Identify!');
    }

    getServices(): Service[] {
        return [this.informationService, this.deviceService];
    }

    getCurrentTemperature(): Nullable<CharacteristicValue> {
        this.platform.log.debug('getCurrentTemperature:', this.accessory.name, '=', this.currentTemperature);
        return this.currentTemperature;
    }

    getTargetTemperature(): Nullable<CharacteristicValue> {
        this.platform.log.debug('getTargetTemperature:', this.accessory.name, '=', this.targetTemperature);
        return this.targetTemperature;
    }

    setTargetTemperature(value: CharacteristicValue) {
        this.platform.log.debug('setTargetTemperature:', this.accessory.name, 'to', value);
        this.targetTemperature = value as number;
        this.platform.shng.setItem(this.accessory.targettemperature, this.targetTemperature);
    }

    getTemperatureDisplayUnits(): Nullable<CharacteristicValue> {
        this.platform.log.debug('getTemperatureDisplayUnits:', this.accessory.name, '=', this.targetTemperatureDisplayUnit);
        return this.targetTemperatureDisplayUnit;
    }

    setTemperatureDisplayUnits(value: CharacteristicValue) {
        this.platform.log.debug('setTemperatureDisplayUnits:', this.accessory.name, 'to', value);
        this.targetTemperatureDisplayUnit = value as number;
        // FUTURE: Bind this to SHNG if needed
    }

    getCurrentHeatingCoolingState(): Nullable<CharacteristicValue> {
        this.platform.log.debug('getCurrentHeatingCoolingState:', this.accessory.name, '=', this.currentHeatingCoolingState);
        return this.currentHeatingCoolingState;
    }

    getTargetHeatingCoolingState(): Nullable<CharacteristicValue> {
        this.platform.log.debug('getTargetHeatingCoolingState:', this.accessory.name, '=', this.targetHeatingCoolingState);
        return this.targetHeatingCoolingState;
    }

    setTargetHeatingCoolingState(value: CharacteristicValue) {
        this.platform.log.debug('setTargetHeatingCoolingState:', this.accessory.name, 'to', value);
        this.targetHeatingCoolingState = value as number;
        // FUTURE: Bind this to SHNG if needed
    }

    shngCurrentTemperatureCallback(value: unknown): void {
        this.platform.log.debug('shngCurrentTemperatureCallback:', this.accessory.name, '=', value, '(' + typeof value + ')');
        if (typeof value === 'number') {
            this.currentTemperature = value;
        } else {
            this.platform.log.warn('Unknown type', typeof value, 'received for', this.accessory.name + ':', value);
        }
        this.deviceService.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, this.currentTemperature);
    }

    shngTargetTemperatureCallback(value: unknown): void {
        this.platform.log.debug('shngTargetTemperatureCallback:', this.accessory.name, '=', value, '(' + typeof value + ')');
        if (typeof value === 'number') {
            this.targetTemperature = value;
        } else {
            this.platform.log.warn('Unknown type', typeof value, 'received for', this.accessory.name + ':', value);
        }
        this.deviceService.updateCharacteristic(this.platform.Characteristic.TargetTemperature, this.targetTemperature);
    }

    shngCurrentHeatingCoolingStateCallback(value: unknown): void {
        this.platform.log.debug('shngCurrentHeatingCoolingStateCallback:', this.accessory.name, '=', value, '(' + typeof value + ')');
        if (typeof value === 'number') {
            switch (value) {
                case 1:
                    this.currentHeatingCoolingState = this.platform.Characteristic.CurrentHeatingCoolingState.HEAT;
                    break;
                case 2:
                    this.currentHeatingCoolingState = this.platform.Characteristic.CurrentHeatingCoolingState.COOL;
                    break;
                default:
                    this.currentHeatingCoolingState = this.platform.Characteristic.CurrentHeatingCoolingState.OFF;
                    break;
            }
            this.deviceService.updateCharacteristic(
                this.platform.Characteristic.CurrentHeatingCoolingState,
                this.currentHeatingCoolingState,
            );
        } else {
            this.platform.log.warn('Unknown type', typeof value, 'received for', this.accessory.name + ':', value);
        }
    }
}


