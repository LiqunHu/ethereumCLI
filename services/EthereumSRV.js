const fs = require('fs');
const path = require('path');
const uuid = require('uuid');
const bip39 = require('bip39')
const hdkey = require('ethereumjs-wallet/hdkey')

const common = require('../util/CommonUtil');
const GLBConfig = require('../util/GLBConfig');
const logger = require('../util/Logger').createLogger('EthereumSRV');
const config = require('../config');
const web3 = require('../util/EthereumClient').web3

exports.EthereumResource = (req, res) => {
  let method = req.query.method
  if (method === 'new_account') {
    new_accountAct(req, res)
  } else if (method === 'create_wallet') {
    create_walletAct(req, res)
  } else if (method === 'create_account') {
    create_accountAct(req, res)
  } else if (method === 'backup_account') {
    backup_accountAct(req, res)
  } else if (method === 'import_account') {
    import_accountAct(req, res)
  } else if (method === 'upload') {
    uploadAct(req, res)
  } else {
    common.sendError(res, 'common_01');
  }
}

async function new_accountAct(req, res) {
  try {
    let doc = common.docTrim(req.body)

    if (!('password' in doc)) {
      return common.sendError(res, 'Ethereum_01');
    }

    let mnemonic = bip39.generateMnemonic()
    let seed = bip39.mnemonicToSeed(mnemonic, "")
    let hdWallet = hdkey.fromMasterSeed(seed)
    let account = hdWallet.derivePath("m/44'/60'/0'/0/0")
    // console.log(account._hdkey._privateKey);
    // let ethAccount = await web3.eth.accounts.privateKeyToAccount('0x'+ account._hdkey._privateKey.toSting('hex'));
    let keystore = await web3.eth.accounts.encrypt('0x'+ account._hdkey._privateKey.toString('hex'), doc.password);

    common.sendData(res, {
      mnemonic: mnemonic,
      keystore: keystore
    });

  } catch (error) {
    common.sendFault(res, error);
  }
}

async function create_walletAct(req, res) {
  try {
    let doc = common.docTrim(req.body)

    if (!('password' in doc)) {
      return common.sendError(res, 'Ethereum_01');
    }

    let wallet;

    if ('count' in doc ){
      wallet = web3.eth.accounts.wallet.create(doc.count, web3.utils.randomHex(32))
    } else {
      wallet = web3.eth.accounts.wallet.create()
    }
    web3.eth.accounts.wallet.save(doc.password)

    // let account = web3.eth.accounts.create();
    common.sendData(res);

  } catch (error) {
    common.sendFault(res, error);
  }
}

async function create_accountAct(req, res) {
  try {
    let doc = common.docTrim(req.body)

    if (!('password' in doc)) {
      return common.sendError(res, 'Ethereum_01');
    }

    let account = web3.eth.accounts.create(web3.utils.randomHex(32));

    common.sendData(res);

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

async function import_accountAct(req, res) {
  try {
    let doc = common.docTrim(req.body)

    if (!('url' in doc)) {
      return common.sendError(res, 'Ethereum_04')
    }

    if (!('name' in doc)) {
      return common.sendError(res, 'Ethereum_05')
    }

    let fileName = path.basename(doc.url)

    let reg = /^UTC--([0-9A-Za-z\-.]+)--([0-9a-zA-Z]{40,40})/

    let rResult = doc.name.match(reg)

    if (!rResult) {
      return common.sendError(res, 'Ethereum_06')
    }

    let address = rResult[2]

    let keystoreDir = path.join(config.datadir, 'keystore')

    let files = fs.readdirSync(keystoreDir)

    let eFile = ''
    for (let f of files) {
      if (f.indexOf(address) > 0) {
        eFile = f
        break
      }
    }
    if (!eFile) {
      let tempfile = path.join(__dirname, '../' + config.uploadOptions.uploadDir + '/' + fileName);
      fs.renameSync(tempfile, path.join(keystoreDir, doc.name))
    }

    common.sendData(res)
  } catch (error) {
    common.sendFault(res, error);
  }
}

async function uploadAct(req, res) {
  try {
    let uploadInfo = await common.fileSave(req)
    common.sendData(res, uploadInfo)
  } catch (error) {
    return common.sendFault(res, error)
  }
}
