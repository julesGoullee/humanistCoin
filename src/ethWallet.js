const assert = require('assert');
const Web3 = require('web3');
const Ethers = require('ethers');

const config = require('./oracleApi/config');
const WebStatic = new Web3();

class EthWallet {

  constructor(data = {}){

    this.data = data;
    assert(EthWallet.initialize, 'node_not_initialize');

  }

  static async initNode(){

    EthWallet.providerWeb3 = new Web3.providers.WebsocketProvider('ws' + config.NODE_URL);
    EthWallet.web3 = new Web3(EthWallet.providerWeb3);
    EthWallet.providerEthers = new Ethers.providers.JsonRpcProvider(
      'http' + config.NODE_URL,
      'kovan'
    );

    try {

      const blockNumber = await this.providerEthers.getBlockNumber();

      console.log('node_connected', { blockNumber });

    } catch (error){

      if(error.responseText && error.responseText.includes(EthWallet.connectionError) ){

        await EthWallet.closeNode();
        throw new Error('node_connection_error');

      }

      throw error;

    }


    EthWallet.initialize = true;
    return true;

  }

  static closeNode(){

    EthWallet.providerWeb3.connection.close();
    EthWallet.providerWeb3 = null;
    EthWallet.web3 = null;
    EthWallet.providerEthers = null;
    EthWallet.initialize = false;

  }

  static generateKeypair() {

    const wallet = Ethers.Wallet.createRandom();

    const publicKey = Ethers.SigningKey.getPublicKey(wallet.privateKey, true);

    return {
      privateKey: wallet.privateKey,
      publicKey,
      address: wallet.address
    };

  }

  static validatePrivateKey(privateKey){

    return WebStatic.utils.isHexStrict(privateKey) && privateKey.length === 66;

  }

  async open(){

    if(this.opened) return;

    if(!this.data.privateKey){

      const keyPair = EthWallet.generateKeypair();

      this.data.privateKey = keyPair.privateKey;
      this.data.publicKey = keyPair.publicKey;
      this.data.address = keyPair.address;

    }

    if(!this.data.publicKey){

      this.data.publicKey = Ethers.SigningKey.getPublicKey(this.data.privateKey, true);

    }

    if(!this.data.address){

      this.data.address = Ethers.SigningKey.publicKeyToAddress(this.data.publicKey, true);

    }

    this.walletClient = new Ethers.Wallet(this.data.privateKey);
    this.walletClient.provider = EthWallet.providerEthers;
    this.opened = true;

  }

  async balance(){

    assert(this.walletClient, 'Uninitialized wallet');

    const balance = await this.walletClient.getBalance();

    return Ethers.utils.formatEther(balance).toString();

  }

  async send(address, value){

    assert(this.walletClient, 'Uninitialized wallet');
    assert(typeof value === 'string', 'Invalid amount');
    assert(EthWallet.web3.utils.isAddress(address), 'invalid_address');

    const transaction = { to: address, gasLimit: 21000 };
    const gasPrice = await EthWallet.web3.eth.getGasPrice();
    transaction.gasPrice = Ethers.utils.bigNumberify(gasPrice);

    transaction.value = Ethers.utils.parseEther(value);

    try {

      const tx = await this.walletClient.sendTransaction(transaction);

      return tx;

    } catch(err){

      if(err.message.includes('sender doesn\'t have enough funds to send tx') ){

        throw new Error('not_enough_balance');

      }

      throw err;

    }

  }

}

EthWallet.initialize = false;
EthWallet.connectionError = 'ECONNREFUSED';

module.exports = EthWallet;
