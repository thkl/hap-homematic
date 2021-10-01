const router = require('express').Router();
const SessionCheck = require('../middleware/sessioncheck');
const path = require('path');
const fs = require('fs');

module.exports = function (core) {

    // @desc    returns system data
    // @route   /api/system

    router.get('/system', SessionCheck, async (req, res) => {
        let sysData = await core.getSystemInfo();
        res.json(sysData);
    });

    router.patch('/system', SessionCheck, async (req, res) => {
        const newSettings = req.body;
        if (newSettings) {
            let configData = core.loadSettings();
            configData.useAuth = newSettings.useAuth;
            configData.useTLS = newSettings.useTLS;
            configData.enableMonitoring = newSettings.enableMonitoring;
            configData.interfaceWatchdog = newSettings.interfaceWatchdog;
            configData.disableHistory = newSettings.disableHistory;
            configData.forceCache = newSettings.forceCache;
            core.saveSettings(configData);
            res.send({ newSettings });
            core.log.info('performing restart');
            core.restartSystem();
        } else {
            res.status(500).send('Missing data');
        }
    })


    router.get('/restart/:debug?', SessionCheck, (req, res) => {
        const debug = req.params.debug;

        if (debug === 'true') {
            // create a indicator in /tmp named .hapdebug
            let fdebug = path.join(fs.realpathSync(os.tmpdir()), '.hapdebug')
            fs.closeSync(fs.openSync(fdebug, 'w'))
        }
        res.send({ resonse: 'rebooting' });
        core.log.info('performing restart');
        core.restartSystem();
    })


    router.post('/resetsystem', SessionCheck, (req, res) => {
        res.send({ resonse: 'reseting' });
        core.log.info('performing reset');
        core.resetSystem();
    })

    return router;
};