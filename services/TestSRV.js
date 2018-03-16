const fs = require('fs');
const uuid = require('uuid');
const path = require('path');
const bip39 = require('bip39')
const hdkey = require('ethereumjs-wallet/hdkey')
const util = require('ethereumjs-util')
const Tx = require('ethereumjs-tx');

const common = require('../util/CommonUtil');
const GLBConfig = require('../util/GLBConfig');
const logger = require('../util/Logger').createLogger('TestSRV');
const config = require('../config');
const web3 = require('../util/EthereumClient').web3

exports.TestResource = (req, res) => {
  let method = req.query.method
  if (method === 'search') {
    searchAct(req, res)
  } else if (method === 'test') {
    testAct(req, res)
  } else {
    common.sendError(res, 'common_01');
  }
}

async function searchAct(req, res) {
  try {
    let mnemonic = bip39.generateMnemonic()
    mnemonic = "leave wasp upgrade couple clump speak outside clever nut silent sibling foot"
    let seed = bip39.mnemonicToSeed(mnemonic, "111111")
    console.log(seed);
    let hdWallet = hdkey.fromMasterSeed(seed)
    let key1 = hdWallet.derivePath("m/44'/60'/0'/0/0")
    console.log(key1._hdkey._privateKey); //private key
    let address1 = util.pubToAddress(key1._hdkey._publicKey, true)
    let address1Check = util.toChecksumAddress(address1.toString('hex'))
    console.log(address1Check); // address
    common.sendData(res);
  } catch (error) {
    common.sendFault(res, error);
  }
}

async function testAct(req, res) {
  try {
    let balance = await web3.eth.getBalance("0xa9857f0f1f8c1770b4c283796834133658c3d30e");
    console.log(balance);
    web3.eth.defaultAccount = "0xa9857f0f1f8c1770b4c283796834133658c3d30e"
    let privateKey = new Buffer('3da5c73935a13375b5dd699138c2a155afb7abd1c512f6130a748fce33ff9d55', 'hex')

    let account = await web3.eth.accounts.privateKeyToAccount('0x3da5c73935a13375b5dd699138c2a155afb7abd1c512f6130a748fce33ff9d55');
    console.log(account);

    let signResult = await web3.eth.accounts.signTransaction({
      to: '0x00d8012bb1579ef4f3c99bde6a28caabe68b3004',
      value: '1000000000',
      gas: 2000000
    }, '0x5f496fd4c501c868672f2c3d6e8e7242c46403bc4f32c22aa6302f097c846838')
    console.log(signResult);
    // let rawTx = {
    //   nonce: '0x00',
    //   gasPrice: '0x09184e72a000',
    //   gasLimit: '0x2710',
    //   to: '0x4c2614bb4f821983866274e2bfe00470f7e3780a',
    //   value: '0x01'
    // }

    let hash = await web3.eth.sendTransaction({
      from: '0x308c16662c2668787c2bb83d0d40a07f6a725520',
      to: '0x4c2614bb4f821983866274e2bfe00470f7e3780a',
      value: '1000000000000000'
    })

    let signTx = await web3.eth.signTransaction({
      from: "0x308c16662c2668787c2bb83d0d40a07f6a725520",
      gasPrice: "20000000000",
      gas: "21000",
      to: '0x4c2614bb4f821983866274e2bfe00470f7e3780a',
      value: "1000000000000000",
      data: ""
    })

    console.log(signTx);
    let hashrlt = await web3.eth.sendSignedTransaction(signTx.raw)
    console.log(hashrlt);

    balance = await web3.eth.getBalance("0x4c2614bb4f821983866274e2bfe00470f7e3780a");
    console.log(balance);


    // let gasPrice = await web3.eth.getGasPrice();
    // console.log(gasPrice);
    // let nonce = await web3.eth.getTransactionCount('0x308c16662c2668787c2bb83d0d40a07f6a725520')+1
    // console.log(nonce);
    //
    // let rawTx = {
    //   nonce: nonce.toString(),
    //   gasPrice: '0x09184e72a000',
    //   gasLimit: '0x5710',
    //   to: '0x4c2614bb4f821983866274e2bfe00470f7e3780a',
    //   value: '0x01',
    //   data: ''
    // }
    // let tx = new Tx(rawTx);
    // tx.sign(privateKey);
    // let serializedTx = tx.serialize()
    // let hash = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
    // console.log(hash);

    common.sendData(res);
  } catch (error) {
    common.sendFault(res, error);
  }
}
