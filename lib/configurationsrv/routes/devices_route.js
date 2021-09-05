const router = require('express').Router();
const SessionCheck = require('../middleware/sessioncheck');
module.exports = function (core) {

  // @desc    Returns the list of devices
  // @route   /api/devices

  router.get('/devices', SessionCheck, async (req, res) => {
    res.json({ devices: core.pluginAccessories })
  });

  router.patch('/device', SessionCheck, async (req, res) => {
    core.saveDevice(req.body);

    res.json({ device: req.body });
  })
  return router;
};