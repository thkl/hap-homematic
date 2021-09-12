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
      deviceList.forEach(deviceToSave => {
        if (!core.saveDevice(deviceToSave)) {
          saveOk = false;
        }
      });
      if (saveOk === true) {
        core.commandReload();
        res.json({ appliances: deviceList });
      } else {
        res.json({ error: 'unable to save' });
      }
    } else {
      console.log(deviceList, 'body is missing')
    }
  })


  return router;
};