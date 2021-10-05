const router = require('express').Router();
const SessionCheck = require('../middleware/sessioncheck');
const path = require('path');
const fs = require('fs');
const CCU = require('../ccu');
const Settings = require('../settings');
module.exports = function (core) {

    // @desc    returns system data
    // @route   /api/system

    router.get('/system', async (req, res) => {
        let sysData = await core.getSystemInfo();
        res.json(sysData);
    });

    router.patch('/system', SessionCheck, async (req, res) => {
        const newSettings = req.body;
        if (newSettings) {
            let configData = Settings.loadSettings();
            configData.useAuth = newSettings.useAuth;
            configData.useTLS = newSettings.useTLS;
            configData.enableMonitoring = newSettings.enableMonitoring;
            configData.interfaceWatchdog = newSettings.interfaceWatchdog;
            configData.disableHistory = newSettings.disableHistory;
            configData.forceCache = newSettings.forceCache;
            Settings.saveSettings(configData);
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

    router.post('/refreshcache', SessionCheck, (req, res) => {
        res.send({ resonse: 'initiate' });
        core.log.info('performing refresh');
        core.refreshCache();
    })

    router.post('/login', async (req, res) => {
        const login = req.body;
        if ((login) && (login.username) && (login.password)) {
            const token = await CCU.login(login.username, login.password);
            res.send({ token: `@${token}@` });
        } else {
            res.status(501).send('Missing Parameter')
        }
    })

    router.get('/support/:address', SessionCheck, async (req, res) => {
        const address = req.params.address;
        const sData = core.getSupportData(address);
        let fileName = '_device.json'
        if ((sData) && (sData.devices)) {
            fileName = sData.devices[0].type + '.json'
        }
        res.set({
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': 'attachment; filename=' + fileName
        })

        res.send(JSON.stringify(sData, ' ', 2))
    });

    return router;
};