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

    return router;
};