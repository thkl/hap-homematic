// this is just a template
const path = require('path')
const HomeMaticDimmerAccessory = require(path.join(__dirname, 'HomeMaticDimmerAccessory.js'))


class HomeMaticIPRGBWAccessory extends HomeMaticDimmerAccessory {
    publishServices(Service, Characteristic) {
        super.publishServices(Service, Characteristic)
        let self = this
        this.colorCharacteristic = this.service.getCharacteristic(Characteristic.Hue)
            .on('get', async (callback) => {
                let value = await self.getValueForDataPointNameWithSettingsKey('hue', null, false)
                if (callback) callback(null, value);
            })
            .on('set', (value, callback) => {
                self.setValueForDataPointNameWithSettingsKey('hue', null, value)
                callback();
            });

        this.colorCharacteristic.eventEnabled = true

        this.saturationCharacteristic = this.service.getCharacteristic(Characteristic.Saturation)
            .on('get', async (callback) => {
                let value = await self.getValueForDataPointNameWithSettingsKey('saturation', null, false)
                if (callback) callback(null, value * 100);
            })
            .on('set', (value, callback) => {
                self.setValueForDataPointNameWithSettingsKey('saturation', null, value / 100)
                callback();
            });

        this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('hue', null, async (newValue) => {
            self.debugLog('event on hue %s', newValue)
            self.updateCharacteristic(self.colorCharacteristic, newValue);
        });

        this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('saturation', null, async (newValue) => {
            self.debugLog('event on saturation %s', newValue)
            self.updateCharacteristic(self.colorCharacteristic, newValue * 100);
        });

    }

    static channelTypes() {
        return ['UNIVERSAL_LIGHT_RECEIVER']
    }

    static configurationItems() {
        return {}
    }

    initServiceSettings() {
        return {
            'UNIVERSAL_LIGHT_RECEIVER': {
                level: { name: 'LEVEL' },
                working: { name: 'PROCESS' },
                hue: { name: 'HUE' },
                saturation: { name: 'SATURATION' }
            }
        }
    }

    static serviceDescription() {
        return 'This service provides a lightbulb where u can set level and color'
    }

    static validate(configurationItem) {
        return false
    }
}

module.exports = HomeMaticIPRGBWAccessory
