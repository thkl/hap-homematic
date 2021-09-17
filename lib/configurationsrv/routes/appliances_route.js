const router = require('express').Router();
const SessionCheck = require('../middleware/sessioncheck');
module.exports = function (core) {

  // @desc    Returns the list of devices
  // @route   /api/appliances

  router.get('/appliances', SessionCheck, async (req, res) => {
    // join all together
    let result = [];
    core.pluginAccessories.forEach(element => {
      result.push(Object.assign({}, element, { applianceType: 'HapDevice' }));
    });

    core.pluginPrograms.forEach(element => {
      result.push(Object.assign({}, element, { applianceType: 'HapProgram' }));
    });

    core.pluginVariables.forEach(element => {
      result.push(Object.assign({}, element, { applianceType: 'HapVariable' }));
    });

    core.pluginSpecial.forEach(element => {
      result.push(Object.assign({}, element, { applianceType: 'HapSpecial' }));
    });

    res.json({ appliances: result, varTrigger: core.pluginVariableTrigger });
  });

  router.patch('/appliance', SessionCheck, async (req, res) => {
    const deviceList = req.body;
    let saveOk = true;
    if (deviceList !== undefined) {
      // sice we may save more that one appliance get the config once and save it only once to the filesystem
      let configData = core.loadSettings();
      let savedDevices = [];
      // loop thru all devices
      await Promise.all(
        deviceList.map(async (deviceToSave) => {
          if ((deviceToSave !== null) && (deviceToSave !== undefined)) {
            core.log.debug('[Config] saving %s', deviceToSave.address);
            const success = await core.saveDevice(deviceToSave, configData, false);
            core.log.debug('[Config] saving %s : %s', deviceToSave.address, success);
            if (!success) {
              saveOk = false;
            } else {
              savedDevices.push(deviceToSave);
            }
          }
        }));

      core.log.debug('[Config] all saved %s reloading', saveOk);
      if (saveOk === true) {
        // creating devices was successfull
        // save the config once
        core.saveSettings(configData);
        // update the instance names
        core.updateInstanceNames(savedDevices);
        // trigget a reload
        core.commandReload();
        // get the list back to the ui
        res.json({ appliances: savedDevices });
      } else {
        res.json({ error: 'unable to save' });
      }
    } else {
      console.log(deviceList, 'body is missing')
    }
  })

  router.delete('/appliance/:address', SessionCheck, async (req, res) => {
    const applianceAddress = req.params.address;
    if (applianceAddress !== undefined) {
      if (core.removeObject(applianceAddress) === true) {
        core.commandReload();
        res.json({ deleted: applianceAddress, error: null });
      } else {
        res.json({ deleted: null, error: 'unable to delte' });
      }
    }
  })

  return router;
};