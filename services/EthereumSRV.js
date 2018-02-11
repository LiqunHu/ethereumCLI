const fs = require('fs');
const path = require('path');
const uuid = require('uuid');

const common = require('../util/CommonUtil');
const GLBConfig = require('../util/GLBConfig');
const logger = require('../util/Logger').createLogger('EthereumSRV');
const config = require('../config');
const web3 = require('../util/EthereumClient').web3

exports.EthereumResource = (req, res) => {
  let method = req.query.method
  if (method === 'personal_newAccount') {
    personal_newAccountAct(req, res)
  } else if (method === 'backup_account') {
    backup_accountAct(req, res)
  } else if (method === 'import_account') {
    import_accountAct(req, res)
  } else {
    common.sendError(res, 'common_01');
  }
}

async function personal_newAccountAct(req, res) {
  try {
    let doc = common.docTrim(req.body)

    if (!('password' in doc)) {
      return common.sendError(res, 'Ethereum_01');
    }

    let address = await web3.eth.personal.newAccount()

    common.sendData(res, {
      address: address
    });

  } catch (error) {
    common.sendFault(res, error);
  }
}

async function backup_accountAct(req, res) {
  try {
    let doc = common.docTrim(req.body)

    if (!('address' in doc)) {
      return common.sendError(res, 'Ethereum_02');
    }

    let keystoreDir = path.join(config.datadir, 'keystore')

    let files = fs.readdirSync(keystoreDir)

    let fileName = ''
    for (let f of files) {
      if (f.indexOf(doc.address) > 0) {
        fileName = f
        break
      }
    }
    if (fileName) {
      res.sendFile(path.join(keystoreDir, fileName))
    } else {
      return common.sendError(res, 'Ethereum_03');
    }

  } catch (error) {
    common.sendFault(res, error);
  }
}
