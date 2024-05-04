const router = require('express').Router();
const SessionCheck = require('../middleware/sessioncheck');
module.exports = function (core) {

    // @desc    This is the template
    // @route   /

    router.get('/', SessionCheck, async (req, res) => {

    });

    return router;
};