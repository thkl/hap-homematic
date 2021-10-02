const router = require('express').Router();
const SessionCheck = require('../middleware/sessioncheck');
const fs = require('fs');

module.exports = function (core) {

    // @desc    This is the backup route
    // @route   /

    router.get('/backup', SessionCheck, async (req, res) => {
        core.log.info('backup Command')
        let backupFile = await core.generateBackup()
        if (fs.existsSync(backupFile)) {
            let statBf = fs.statSync(backupFile)
            let d = new Date();
            readStream = fs.createReadStream(backupFile)
            const headers = {
                'Content-Disposition': `attachment; filename=hap-homematic-backup-${d.getDate()}_${d.getMonth() + 1}_${d.getFullYear()}_${d.getHours()}_${d.getMinutes()}_${d.getSeconds()}.tar.gz`,
            }
            res.sendFile(backupFile, { headers })
        } else {
            res.send({ error: 'backup file not found', path: backupFile })
        }
    });

    router.post('/restore', SessionCheck, async (req, res) => {
        res.send({ result: 'ok' });
    })

    return router;
};