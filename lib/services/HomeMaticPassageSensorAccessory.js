
const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticPassageSensorAccessory extends HomeMaticAccessory {

    publishServices(Service, Characteristic) {
        let self = this

        this.contact1 = this.getService(Service.ContactSensor)

        let active1 = this.contact1.getCharacteristic(Characteristic.StatusActive)
            .on('get', (callback) => {
                callback(null, true)
            })
        active1.updateValue(true, null)

        this.state1 = this.contact.getCharacteristic(Characteristic.ContactSensorState)
            .on('get', async (callback) => {
                if (callback) {
                    callback(null, false); // this should always be off because this is only an event driven device
                }
            });


        this.contact2 = this.getService(Service.ContactSensor)

        let active2 = this.contact2.getCharacteristic(Characteristic.StatusActive)
            .on('get', (callback) => {
                callback(null, true)
            })
        active2.updateValue(true, null)

        this.state2 = this.contact.getCharacteristic(Characteristic.ContactSensorState)
            .on('get', async (callback) => {
                if (callback) {
                    callback(null, false); // this should always be off because this is only an event driven device
                }
            });


        this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('state', null, (newValue) => {
            if (newValue === true) {
                // Fire Contact 1
                self.state1.updateValue(1, null);
                setTimeout(() => { // And Reset
                    self.state1.updateValue(0, null);
                }, 1000);
            }
            if (newValue === false) {
                // Fire Contact 2
                self.state2.updateValue(1, null);
                setTimeout(() => { // and reset
                    self.state2.updateValue(0, null);
                }, 1000);
            }
        })

    }

    initServiceSettings() {
        return {
            'PASSAGE_DETECTOR_DIRECTION_TRANSMITTER': {
                state: {
                    name: 'CURRENT_PASSAGE_DIRECTION',
                    boolean: true
                }
            }
        }
    }

    static channelTypes() {
        return ['PASSAGE_DETECTOR_DIRECTION_TRANSMITTER']
    }

    static serviceDescription() {
        return 'This service provides a Passage Sensor in HomeKit'
    }


}
module.exports = HomeMaticPassageSensorAccessory
