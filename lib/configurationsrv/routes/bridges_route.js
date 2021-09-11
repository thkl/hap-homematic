const router = require('express').Router();
const SessionCheck = require('../middleware/sessioncheck');
module.exports = function (core) {

    // @desc    return the list of bridges
    // @route   /api/bridges

    router.get('/bridges', SessionCheck, async (req, res) => {
        res.json({ instances: core.bridges });
    });

    // @desc    publish all bridges
    // @route   /api/bridges/ListOfIDs

    router.post('/bridges/:idlist', SessionCheck, async (req, res) => {
        // Save PublishDevices Infos
        let bridgesToPublish = req.params.idlist
        if (bridgesToPublish) {
            core.log.debug('[Config] setPublish flag for %s', bridgesToPublish)
            core.savePublishingFlag(JSON.parse(bridgesToPublish))
        }

        core.process.send({
            topic: 'reloadApplicances'
        })

        res.json({ result: 'initiated' });
    });

    router.patch('/bridges', SessionCheck, async (req, res) => {
        let bridgeInstances = req.body;
        if (bridgeInstances !== undefined) {
            if (!Array.isArray(bridgeInstances)) {
                bridgeInstances = [bridgeInstances]; // just in case
            }
            let result = [];
            bridgeInstances.forEach(instance => {
                core.log.debug('[Config] saving %s', JSON.stringify(instance));
                const rsl = core.saveInstance(instance);
                if (rsl !== false) {
                    core.log.debug('[Config] ok');
                    result.push(rsl);
                }
            });
            if (result.length > 0) {
                core.commandReload();
                res.json({ instances: result });
            } else {
                res.json({ error: "unable to save" });
            }
        } else {
            console.log(deviceList, 'body is missing')
        }
    })

    router.delete('/bridges/:id', SessionCheck, async (req, res) => {
        const instanceObjectId = req.params.id;
        if (instanceObjectId !== undefined) {
            if (core.deleteInstance(instanceObjectId) === true) {
                core.commandReload();
                res.json({ deleted: instanceObjectId, error: null });
            } else {
                res.json({ deleted: null, error: 'unable to delte' });
            }
        }

    })

    return router;
};