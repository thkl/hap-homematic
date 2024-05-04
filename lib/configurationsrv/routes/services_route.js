const router = require('express').Router();
const SessionCheck = require('../middleware/sessioncheck');
const CCU = require('../ccu');
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

    router.get('/ccurooms', SessionCheck, async (req, res) => {
        res.json({ rooms: core.pluginRooms });
    });

    router.get('/ccuvirtualkeys', SessionCheck, async (req, res) => {
        res.json({ virtualkeys: core.virtualKeys });
    });

    router.get('/ccuchannels/:typelist', SessionCheck, async (req, res) => {
        // will return a devicelist with channels of the type in the list
        const strTypeList = req.params.typelist;
        if (strTypeList) {
            const typelist = strTypeList.split(',');
            if (typelist.length > 0) {
                const devices = await CCU.ccuGetDevices(typelist);
                res.json({ devices })
            } else {
                res.status(501).send('empty types');
            }
        } else {
            res.status(501).send('missing types')
        }
    });

    router.get('/service/:type/:address?', SessionCheck, async (req, res) => {
        const appliancetype = req.params.type;
        const channelAddress = req.params.address;

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
                const result = {}
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