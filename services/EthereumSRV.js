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
    } else if (method === 'recover_by_keystore') {
        recover_by_keystoreAct(req, res)
    } else if (method === 'recover_by_mnemonic') {
        recover_by_mnemonicAct(req, res)
    } else if (method === 'recover_by_privatekey') {
        recover_by_privatekeyAct(req, res)
    } else if (method === 'keystore_to_privatekey') {
        keystore_to_privatekeyAct(req, res)
    } else if (method === 'change_password') {
        change_passwordAct(req, res)
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
        let keystore = await web3.eth.accounts.encrypt('0x' + account._hdkey._privateKey.toString('hex'), doc.password);

        common.sendData(res, {
            mnemonic: mnemonic,
            keystore: keystore
        });

    } catch (error) {
        common.sendFault(res, error);
    }
}

async function recover_by_keystoreAct(req, res) {
    try {
        let doc = common.docTrim(req.body)

        if (!('password' in doc)) {
            return common.sendError(res, 'Ethereum_01');
        }

        if (!('keystore' in doc)) {
            return common.sendError(res, 'Ethereum_02');
        }

        let account = await web3.eth.accounts.decrypt(doc.keystore, doc.password);

        if (account) {
            return common.sendData(res)
        } else {
            return common.sendError(res, 'Ethereum_03');
        }

    } catch (error) {
        common.sendFault(res, error);
    }
}

async function recover_by_mnemonicAct(req, res) {
    try {
        let doc = common.docTrim(req.body)

        if (!('password' in doc)) {
            return common.sendError(res, 'Ethereum_01');
        }

        if (!('mnemonic' in doc)) {
            return common.sendError(res, 'Ethereum_04');
        }

        let seed = bip39.mnemonicToSeed(doc.mnemonic, "")

        let hdWallet = hdkey.fromMasterSeed(seed)
        let account = hdWallet.derivePath("m/44'/60'/0'/0/0")

        let keystore = await web3.eth.accounts.encrypt('0x' + account._hdkey._privateKey.toString('hex'), doc.password);

        common.sendData(res, {
            keystore: keystore
        });
    } catch (error) {
        common.sendFault(res, error);
    }
}

async function recover_by_privatekeyAct(req, res) {
    try {
        let doc = common.docTrim(req.body)

        if (!('password' in doc)) {
            return common.sendError(res, 'Ethereum_02');
        }

        if (!('privatekey' in doc)) {
            return common.sendError(res, 'Ethereum_05');
        }

        let keystore = await web3.eth.accounts.encrypt(doc.privatekey, doc.password);

        common.sendData(res, {
            keystore: keystore
        });

    } catch (error) {
        common.sendFault(res, error);
    }
}

async function keystore_to_privatekeyAct(req, res) {
    try {
        let doc = common.docTrim(req.body)

        if (!('password' in doc)) {
            return common.sendError(res, 'Ethereum_01');
        }

        if (!('keystore' in doc)) {
            return common.sendError(res, 'Ethereum_02');
        }

        let account = await web3.eth.accounts.decrypt(doc.keystore, doc.password);

        if (account) {
            return common.sendData(res, {
                privatekey: account.privateKey
            })
        } else {
            return common.sendError(res, 'Ethereum_03');
        }
    } catch (error) {
        common.sendFault(res, error);
    }
}

async function change_passwordAct(req, res) {
    try {
        let doc = common.docTrim(req.body)

        if (!('oldpwd' in doc)) {
            return common.sendError(res, 'Ethereum_01');
        }

        if (!('newpwd' in doc)) {
            return common.sendError(res, 'Ethereum_01');
        }

        if (!('keystore' in doc)) {
            return common.sendError(res, 'Ethereum_02');
        }

        let account = await web3.eth.accounts.decrypt(doc.keystore, doc.oldpwd);

        let keystore = await web3.eth.accounts.encrypt(account.privateKey, doc.newpwd);

        common.sendData(res, {
            keystore: keystore
        });
    } catch (error) {
        common.sendFault(res, error);
    }
}
