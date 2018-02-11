const fs = require('fs');
const uuid = require('uuid');
const path = require('path');

const common = require('../util/CommonUtil');
const GLBConfig = require('../util/GLBConfig');
const logger = require('../util/Logger').createLogger('TestSRV');
const config = require('../config');

exports.TestResource = (req, res) => {
    let method = req.query.method
    if (method === 'search') {
        searchAct(req, res)
    } else {
        common.sendError(res, 'common_01');
    }
}

async function searchAct(req, res) {
    try {
        console.log(3333);
        common.sendData(res);
    } catch (error) {
        common.sendFault(res, error);
    }
}
