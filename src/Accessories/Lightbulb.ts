import {
    AccessoryPlugin,
    CharacteristicValue,
    Service,
    Nullable,
} from 'homebridge';

import { SmartHomeNGPlatform } from '../platform';

type RGBW = {
    R: number;
    G: number;
    B: number;
    W: number;
};

type RGB = {
    R: number;
    G: number;
    B: number;
};

enum LightType { ONOFF, DIMMABLE, RGB, RGBW, HSB }

export class Lightbulb implements AccessoryPlugin {
    private readonly deviceService: Service;
    private readonly informationService: Service;

    public name: string;
    private switchOn = false;
    private brightness = 0; brightnessMin = 0; private brightnessMax = 1000;
    private R = 0; RMin = 0; RMax = 100;
    private G = 0; GMin = 0; GMax = 100;
    private B = 0; BMin = 0; BMax = 100;
    private W = 0; WMin = 0; WMax = 100;
    private hue = 0;
    private saturation = 0;
    private lightType = LightType.ONOFF;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(private readonly platform: SmartHomeNGPlatform, private readonly accessory: any) {
        this.name = accessory.name;
        this.deviceService = new this.platform.Service.Lightbulb(accessory.name);

        // create handlers for required characteristics
        this.deviceService.getCharacteristic(this.platform.Characteristic.On)
            .onGet(this.getOn.bind(this))
            .onSet(this.setOn.bind(this));
        this.platform.shng.addMonitor(accessory.on, this.shngOnCallback.bind(this));

        if (accessory.brightness) {
            this.lightType = LightType.DIMMABLE;
        }

        if (accessory.hue && accessory.saturation && accessory.brightness) {
            this.lightType = LightType.HSB;
        }

        if (accessory.r && accessory.g && accessory.b) {
            this.lightType = LightType.RGB;
            if (accessory.w) {
                this.lightType = LightType.RGBW;
            }
        }

        // Characteristic dimmable is valid for every light except simple ON/OFF
        if (this.lightType !== LightType.ONOFF) {
            this.deviceService.getCharacteristic(this.platform.Characteristic.Brightness)
                .onGet(this.getBrightness.bind(this))
                .onSet(this.setBrightness.bind(this));
            this.platform.shng.addMonitor(accessory.brightness, this.shngBrightnessCallback.bind(this));
        }


        // If HSB, RGB or RGBW light
        if (this.lightType === LightType.HSB || this.lightType === LightType.RGB || this.lightType === LightType.RGBW) {
            this.deviceService.getCharacteristic(this.platform.Characteristic.Hue)
                .onGet(this.getHue.bind(this))
                .onSet(this.setHue.bind(this));

            this.deviceService.getCharacteristic(this.platform.Characteristic.Saturation)
                .onGet(this.getSaturation.bind(this))
                .onSet(this.setSaturation.bind(this));
            if (this.lightType === LightType.RGB || this.lightType === LightType.RGBW) {
                this.platform.shng.addMonitor(accessory.R, this.shngRCallback.bind(this));
                this.platform.shng.addMonitor(accessory.G, this.shngGCallback.bind(this));
                this.platform.shng.addMonitor(accessory.B, this.shngBCallback.bind(this));
                if (this.lightType === LightType.RGBW) {
                    this.platform.shng.addMonitor(accessory.W, this.shngWCallback.bind(this));
                }
            }
        }



        this.informationService =
            new this.platform.Service.AccessoryInformation()
                .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.manufacturer)
                .setCharacteristic(this.platform.Characteristic.Model, accessory.model)
                .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.on);

        this.brightnessMax = accessory.brightnessmax ? accessory.brightnessmax : this.brightnessMax;
        this.brightnessMin = accessory.brightnessmin ? accessory.brightnessmin : this.brightnessMin;
        this.RMax = accessory.rmax ? accessory.rmax : this.RMax;
        this.RMin = accessory.rmin ? accessory.rmin : this.RMin;
        this.GMax = accessory.gmax ? accessory.gmax : this.GMax;
        this.GMin = accessory.gmin ? accessory.gmin : this.GMin;
        this.BMax = accessory.bmax ? accessory.bmax : this.BMax;
        this.BMin = accessory.bmin ? accessory.bmin : this.BMin;
        this.WMax = accessory.wmax ? accessory.wmax : this.WMax;
        this.WMin = accessory.wmin ? accessory.wmin : this.WMin;
        this.platform.log.info("Lightbulb '%s' created! (" + LightType[this.lightType] + ')', accessory.name);
    }

    identify(): void {
        this.platform.log.info('Identify!');
    }

    getServices(): Service[] {
        return [this.informationService, this.deviceService];
    }

    getOn(): Nullable<CharacteristicValue> {
        this.platform.log.info('GetOn:', this.accessory.name, 'is currently', (this.switchOn ? 'ON' : 'OFF'));
        return this.switchOn;
    }

    setOn(value: CharacteristicValue) {
        this.switchOn = value as boolean;
        this.platform.log.info('SetOn:', this.accessory.name, 'was set to', (this.switchOn ? 'ON' : 'OFF'));
        this.platform.shng.setItem(this.accessory.on, this.switchOn);
    }

    getBrightness(): Nullable<CharacteristicValue> {
        this.platform.log.info('getBrightness:', this.accessory.name, 'brightness is currently', this.brightness);
        return this.brightness;
    }

    setBrightness(value: CharacteristicValue) {
        this.brightness = value as number;
        this.platform.log.info('setBrightness:', this.accessory.name, 'was set to', value);

        this.platform.shng.setItem(
            this.accessory.brightness,
            this.convertRange(this.brightness, 0, 100, this.brightnessMin, this.brightnessMax),
        );
        this.updateColor();
    }

    getHue(): Nullable<CharacteristicValue> {
        this.platform.log.info('getHue:', this.accessory.name, 'hue is currently', this.brightness);
        return this.hue;
    }

    setHue(value: CharacteristicValue) {
        this.hue = value as number;
        this.platform.log.info('setHue:', this.accessory.name, 'was set to', value);
        this.updateColor();
    }

    getSaturation(): Nullable<CharacteristicValue> {
        this.platform.log.info('getSaturation:', this.accessory.name, 'saturation is currently', this.brightness);
        return this.saturation;
    }

    setSaturation(value: CharacteristicValue) {
        this.saturation = value as number;
        this.platform.log.info('setSaturation:', this.accessory.name, 'was set to', value);
        this.updateColor();
    }

    updateColor(): void {
        if (this.lightType === LightType.RGBW) {
            const rgbw: RGBW = this.hsb2rgbw(this.hue, this.saturation, this.brightness);
            this.platform.shng.setItem(this.accessory.r, this.convertRange(rgbw.R, 0, 100, this.RMin, this.RMax));
            this.platform.shng.setItem(this.accessory.g, this.convertRange(rgbw.G, 0, 100, this.GMin, this.GMax));
            this.platform.shng.setItem(this.accessory.b, this.convertRange(rgbw.B, 0, 100, this.BMin, this.BMax));
            this.platform.shng.setItem(this.accessory.w, this.convertRange(rgbw.W, 0, 100, this.WMin, this.WMax));
        } else if (this.lightType === LightType.RGB) {
            const rgb: RGB = this.hsb2rgb(this.hue, this.saturation, this.brightness);
            this.platform.shng.setItem(this.accessory.r, this.convertRange(rgb.R, 0, 100, this.RMin, this.RMax));
            this.platform.shng.setItem(this.accessory.g, this.convertRange(rgb.G, 0, 100, this.GMin, this.GMax));
            this.platform.shng.setItem(this.accessory.b, this.convertRange(rgb.B, 0, 100, this.BMin, this.BMax));
        } else {
            this.platform.log.warn('Cannot update color of', this.name, 'because RGB(W) items are missing');
        }
    }

    shngOnCallback(value: unknown): void {
        this.platform.log.debug('shngOnCallback:', this.accessory.name, '=', value, '(' + typeof value + ')');
        if (typeof value === 'boolean') {
            this.switchOn = value;
            this.deviceService.updateCharacteristic(this.platform.Characteristic.On, this.switchOn);
        } else {
            this.platform.log.warn('Unknown type ', typeof value, 'received for', this.accessory.name + ':', value);
        }
    }

    shngBrightnessCallback(value: unknown): void {
        this.platform.log.debug('shngBrightnessCallback:', this.accessory.name, '=', value, '(' + typeof value + ')');
        if (typeof value === 'number') {
            this.brightness = this.convertRange(value as number, this.brightnessMin, this.brightnessMax, 0, 100);
            this.deviceService.updateCharacteristic(this.platform.Characteristic.Brightness, this.brightness);
        } else {
            this.platform.log.warn('Unknown type ', typeof value, 'received for', this.accessory.name + ':', value);
        }
    }

    shngRCallback(value: unknown): void {
        // TODO
    }

    shngGCallback(value: unknown): void {
        // TODO
    }

    shngBCallback(value: unknown): void {
        // TODO
    }

    shngWCallback(value: unknown): void {
        // TODO
    }

    // Credits to: https://github.com/Sunoo/homebridge-gpio-rgbw-ledstrip/blob/master/src/index.ts
    hsb2rgbw(H: number, S: number, B: number): RGBW {
        const rgbw = { R: 0, G: 0, B: 0, W: 0 };

        if (H === 0 && S === 0) {
            rgbw.W = B;
        } else {
            const segment = Math.floor(H / 60);
            const offset = H % 60;
            const mid = B * offset / 60;

            rgbw.W = Math.round(B / 100 * (100 - S));

            if (segment === 0) {
                rgbw.R = Math.round(S / 100 * B);
                rgbw.G = Math.round(S / 100 * mid);
            } else if (segment === 1) {
                rgbw.R = Math.round(S / 100 * (B - mid));
                rgbw.G = Math.round(S / 100 * B);
            } else if (segment === 2) {
                rgbw.G = Math.round(S / 100 * B);
                rgbw.B = Math.round(S / 100 * mid);
            } else if (segment === 3) {
                rgbw.G = Math.round(S / 100 * (B - mid));
                rgbw.B = Math.round(S / 100 * B);
            } else if (segment === 4) {
                rgbw.R = Math.round(S / 100 * mid);
                rgbw.B = Math.round(S / 100 * B);
            } else if (segment === 5) {
                rgbw.R = Math.round(S / 100 * B);
                rgbw.B = Math.round(S / 100 * (B - mid));
            }
        }

        return rgbw;
    }

    // Credits to: https://www.30secondsofcode.org/js/s/hsb-to-rgb
    hsb2rgb(H: number, S: number, B: number): RGB {
        const rgb = { R: 0, G: 0, B: 0 };
        S /= 100;
        B /= 100;
        const k = (n) => (n + H / 60) % 6;
        const f = (n) => B * (1 - S * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
        rgb.R = f(5) + 100;
        rgb.G = f(3) + 100;
        rgb.B = f(1) + 100;
        return rgb;
    }

    convertRange(value: number, oldmin: number, oldmax: number, newmin: number, newmax: number): number {
        return (((value - oldmin) * (newmax - newmin)) / (oldmax - oldmin)) + newmin;
    }
}
