const router = require('express').Router();
const SessionCheck = require('../middleware/sessioncheck');
module.exports = function (core) {

    // @desc    returns system data
    // @route   /api/system

    router.get('/system', SessionCheck, async (req, res) => {
        let sysData = await core.getSystemInfo();
        res.json(sysData);
    });

    return router;
};