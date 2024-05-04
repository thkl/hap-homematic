const router = require('express').Router();
const SessionCheck = require('../middleware/sessioncheck');
const path = require('path');
const fs = require('fs');
const Settings = require('../settings');

getCrashList = function (core) {
    const files = [];
    try {
        const items = fs.readdirSync(Settings.getConfigPath())
        items.forEach((item) => {
            if (item.match(/.*.crash/)) {
                files.push(item.replace(/.crash/, ''));
            }
        })
        return files
    } catch (e) {
        return false
    }
}

module.exports = function (core) {

    // @desc    This will get all crashes or a specific one if the id was specified
    // @route   /crashes/:id?

    router.get('/crashes/:id?', SessionCheck, async (req, res) => {
        let id = req.params.id;
        if (id !== undefined) {
            id = id.replace('..', ''); // remove .. 
            const file = path.join(Settings.getConfigPath(), `${id}.crash`)
            if (fs.existsSync(file)) {
                res.sendFile(file);
            } else {
                res.status(404)
            }
        } else {
            const list = getCrashList(core);
            if (list === false) {
                res.status(500);
            } else {
                res.json(list);
            }
        }
    });

    // @desc    This will delete a crash file if the id was specified
    // @route   /crashes/:id?
    router.delete('/crashes/:id', SessionCheck, (req, res) => {
        let id = req.params.id;
        if (id !== undefined) {
            id = id.replace('..', ''); // remove ..
            const file = path.join(Settings.getConfigPath(), `${id}.crash`)
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
                const list = getCrashList(core);
                if (list === false) {
                    res.status(500).send(e);
                } else {
                    res.json(list);
                }
            } else {
                res.status(404);
            }
        }
    })

    return router;
};