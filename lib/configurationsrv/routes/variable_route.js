const router = require('express').Router();
const SessionCheck = require('../middleware/sessioncheck');
module.exports = function (core) {

    // @desc    Returns the variable list
    // @route   /api/variables

    router.get('/variables', SessionCheck, async (req, res) => {
        let srvList = core.getVariableServiceList()
        res.json({ variables: core.pluginVariables, trigger: core.pluginVariableTrigger, services: srvList });
    });

    return router;
};