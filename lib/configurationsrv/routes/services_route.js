const router = require('express').Router();
const SessionCheck = require('../middleware/sessioncheck');
module.exports = function (core) {

    // @desc    This is the template
    // @route   /

    router.get('/ccudevices', SessionCheck, async (req, res) => {
        const list = core.createCompatibleDeviceList();
        res.json({ devices: list });
    });


    router.get('/ccuvariables', SessionCheck, async (req, res) => {
        const list = core.createCompatibleVariableList();
        res.json({ variables: list });
    });


    router.get('/ccuprograms', SessionCheck, async (req, res) => {
        const list = core.createCompatibleProgramsList();
        res.json({ programs: list });
    });


    router.get('/service/:type/:address?', SessionCheck, async (req, res) => {
        let appliancetype = req.params.type;
        let channelAddress = req.params.address;

        switch (appliancetype) {
            case 'HapDevice':
                res.json(core.serviceSettingsFor(channelAddress));
                break;
            case 'HapVariable':
                res.json({ service: core.getVariableServiceList() });
                break;
            case 'HapProgram':
                res.json({ service: core.getProgramServiceList() });
                break;
            case 'HapSpecial':
                let result = {}
                result.service = []
                core.getServices('SPECIAL').map(item => {
                    result.service.push(item)
                })
                res.json(result);
                break;
        }
    })

    return router;
};