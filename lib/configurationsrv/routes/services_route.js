const router = require('express').Router();
const SessionCheck = require('../middleware/sessioncheck');
module.exports = function (core) {

    // @desc    This is the template
    // @route   /

    router.get('/ccudevices', SessionCheck, async (req, res) => {
        const list = core.createCompatibleDeviceList();
        res.json({ devices: list });
    });


    router.get('/service/:type', SessionCheck, async (req, res) => {
        let channelAddress = req.params.type;
        if (channelAddress === 'new:special') {
            let result = {}
            result.service = []
            core.getServices('SPECIAL').map(item => {
                result.service.push(item)
            })
            res.json(result);
        } else {
            res.json(core.serviceSettingsFor(channelAddress));
        }
    })

    return router;
};