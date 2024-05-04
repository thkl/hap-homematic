const router = require('express').Router();
const SessionCheck = require('../middleware/sessioncheck');
const Settings = require('../settings');

module.exports = function (core) {

  // @desc    Returns the list of devices
  // @route   /api/appliances

  router.get('/appliances', SessionCheck, async (req, res) => {
    res.json({
      appliances: core.getApplianceList(),
      varTrigger: core.pluginVariableTrigger,
      createHelper: core.autoUpdateVarTriggerHelper
    });
  });



  router.patch('/appliance', SessionCheck, async (req, res) => {
    const deviceList = req.body;
    let saveOk = true;
    if (deviceList !== undefined) {
      // sice we may save more that one appliance get the config once and save it only once to the filesystem
      let configData = Settings.loadSettings();
      let savedDevices = [];
      // loop thru all devices
      await Promise.all(
        deviceList.map(async (deviceToSave) => {
          if ((deviceToSave !== null) && (deviceToSave !== undefined)) {
            core.log.debug('[Config] saving %s', deviceToSave.address);
            const saveResult = await core.saveDevice(deviceToSave, configData, false);
            const success = saveResult.success;
            core.log.debug('[Config] saving %s : %s', deviceToSave.address, success);
            if (!success) {
              saveOk = false;
            } else {
              deviceToSave.instances = deviceToSave.settings.instance;
              savedDevices.push(deviceToSave);
            }
          }
        }));

      core.log.debug('[Config] all saved %s reloading', saveOk);
      if (saveOk === true) {
        // creating devices was successfull^
        // save the config once
        Settings.saveSettings(configData);
        // update the instance names
        core.updateInstanceNames(savedDevices);

        // trigget a reload
        core.commandReload();
        // get the list back to the ui
        res.json({ appliances: savedDevices });
      } else {
        res.status(500).send('unable to save')
      }
    } else {
      res.status(500).send('missing data')
    }
  })

  router.delete('/appliance/:address', SessionCheck, async (req, res) => {
    const applianceAddress = req.params.address;
    if (applianceAddress !== undefined) {
      if (core.removeObject(applianceAddress) === true) {
        core.commandReload();
        res.json({ deleted: applianceAddress, error: null });
      } else {
        res.status(500).send(`unable to delete ${applianceAddress} was not found`);
      }
    }
  })


  router.patch('/activate', SessionCheck, async (req, res) => {
    const deviceList = req.body;
    if (deviceList !== undefined) {
      let configData = Settings.loadSettings();
      core.log.debug('[Config] savePublishingFlag old Data %s', deviceList)
      deviceList.map(bridgeId => {
        core.log.debug('[Config] savePublishingFlag %s', bridgeId)
        let oBridge = configData.instances[bridgeId]
        oBridge.publishDevices = true
      })
      Settings.saveSettings(configData);
      core.commandReload();
      res.json({ activated: deviceList, error: null });
    } else {
      res.status(500).send(`unable to activate missing arguments`);
    }
  })

  router.patch('/trigger', SessionCheck, async (req, res) => {
    const dataPoint = req.body.datapoint;
    const createHelper = req.body.trigger;
    if (core.saveVariableTrigger(dataPoint, createHelper)) {
      res.send({ dataPoint: dataPoint, createHelper: createHelper });
    }
    let configData = Settings.loadSettings();

    if (configData.autoUpdateVarTriggerHelper === true) {
      // Update the Trigger Program
      core.process.send({
        topic: 'createTrigger'
      })
    }
  });

  return router;
};