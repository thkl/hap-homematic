const CCU = require('../ccu');

/*
    * Express Middleware Session Check
    */
module.exports = async function sessionCheck(req, res, next) {
    let sid = req.query.sid;
    if (CCU.sidRequired === true) {
        if (sid !== undefined) {
            if (await CCU.isValidCCUSession(sid)) {
                next();
            } else {
                res.status(401).send("Sorry! Invalid Authorization");
            }
        } else {
            res.status(401).send("Sorry! Authorization is required");
        }
    } else {
        next();
    }
}