const router = require('express').Router();
const SessionCheck = require('../middleware/sessioncheck');
module.exports = function (core) {

    // @desc    return the list of instances
    // @route   /api/instances

    router.get('/instances', SessionCheck, async (req, res) => {
        res.json({ instances: core.bridges });
    });

    // @desc    publish all instances
    // @route   /api/instances/ListOfIDs

    router.post('/instances/:idlist', SessionCheck, async (req, res) => {
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

    router.post('/instances', SessionCheck, async (req, res) => {
        let bridgeInstances = req.body;
        if (bridgeInstances !== undefined) {
            if (!Array.isArray(bridgeInstances)) {
                bridgeInstances = [bridgeInstances]; // just in case
            }
            let result = [];
            bridgeInstances.forEach(instance => {
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
                res.status(500).send('unable to save')
            }
        } else {
            res.status(500).send('no data')
        }
    })

    router.patch('/instances', SessionCheck, async (req, res) => {
        let bridgeInstances = req.body;
        if (bridgeInstances !== undefined) {
            if (!Array.isArray(bridgeInstances)) {
                bridgeInstances = [bridgeInstances]; // just in case
            }
            let result = [];
            bridgeInstances.forEach(instance => {
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
                res.status(500).send('unable to save')
            }
        } else {
            res.status(500).send('no data')
        }
    })

    router.delete('/instances/:id', SessionCheck, async (req, res) => {
        const instanceObjectId = req.params.id;
        if (instanceObjectId !== undefined) {
            if (core.deleteInstance(instanceObjectId) === true) {
                core.commandReload();
                res.json({ deleted: instanceObjectId, error: null });
            } else {
                res.status(500).send(`unable to delete instance ${instanceObjectId} was not found`)
            }
        }

    })

    return router;
};