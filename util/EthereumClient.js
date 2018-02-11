const Web3 = require('web3');

let web3cli = undefined

if (typeof web3cli !== 'undefined') {
  web3cli = new Web3(web3cli.currentProvider);
} else {
  // set the provider you want from Web3.providers
  web3cli = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

exports.web3 = web3cli
