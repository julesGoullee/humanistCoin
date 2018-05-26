const assert = require('assert');
const Web3 = require('web3');
const Ethers = require('ethers');
const _D = require('decimal.js');
const Decimal = _D.default || _D;
const config = require('./config');
const WebStatic = new Web3();
const Utils = require('./utils');
const Errors = require('./utils/errors');

class EthWallet {

  constructor(data = {}){

    this.data = data;
    assert(EthWallet.initialize, 'node_not_initialize');

  }

  static async initNode(){

    EthWallet.providerWeb3Ws = new Web3.providers.WebsocketProvider(config.NODE_URL_WS);
    EthWallet.web3Ws = new Web3(EthWallet.providerWeb3Ws);
    EthWallet.providerWeb3 = new Web3.providers.HttpProvider(config.NODE_URL);
    EthWallet.web3 = new Web3(EthWallet.providerWeb3);

    EthWallet.providerEthers = new Ethers.providers.JsonRpcProvider(
      config.NODE_URL,
      config.NETWORK
    );

    try {

      const blockNumber = await this.providerEthers.getBlockNumber();

      console.log('node_connected', { blockNumber });

    } catch (error){

      if(
        (error.responseText && EthWallet.connectionErrors.find(conError => error.responseText.includes(conError) ) ) ||
        (error.orginialError && error.orginialError.message &&
          EthWallet.connectionErrors.find(conError => error.orginialError.message.includes(conError) ) ) ){

        await EthWallet.closeNode();
        Errors.throwError('node_connection_error', {}, true);

      }

      throw error;

    }

    EthWallet.initialize = true;

    const onClose = async () => {

      console.warn('onClose');

      if(EthWallet.initialize && EthWallet.providerWeb3Ws.connection.readyState !== 1){ // todo ready

        await EthWallet.waitWsConnection();

        EthWallet.providerWeb3Ws.connection.addEventListener('close', onClose);
        EthWallet.providerWeb3Ws.connection.addEventListener('error', onClose);

      }

    };

    EthWallet.providerWeb3Ws.connection.addEventListener('close', onClose);
    EthWallet.providerWeb3Ws.connection.addEventListener('error', onClose);

    if(EthWallet.providerWeb3Ws.connection.readyState !== 1){ // todo ready

      await EthWallet.waitWsConnection();

    }

    return true;

  }

  static async waitWsConnection(isMain){

    if(EthWallet.wsIsConnecting && !isMain){

      console.info('ws queue reconnecting');
      return new Promise( (resolve) => EthWallet.wsWaitConnection.push(resolve) );

    }

    EthWallet.wsIsConnecting = true;
    console.info('ws connecting');

    return new Promise( (resolve) => {

      let timeout = null;

      const onOpen = async () => {

        console.info('ws open');

        if(timeout){

          clearTimeout(timeout);

        }
        EthWallet.wsWaitConnection.forEach(r => r() );
        EthWallet.wsWaitConnection = [];
        EthWallet.wsIsConnecting = false;
        resolve();

      };

      timeout = setTimeout( async () => {

        if(EthWallet.initialize){

          console.info('ws timeout try new connection');
          EthWallet.wsIsConnecting = true;
          EthWallet.providerWeb3Ws.connection.close();
          EthWallet.providerWeb3Ws.connection.removeEventListener('open', onOpen);

          await Utils.wait(2000);
          EthWallet.providerWeb3Ws = new Web3.providers.WebsocketProvider(config.NODE_URL_WS);
          EthWallet.web3Ws = new Web3(EthWallet.providerWeb3Ws);

          await EthWallet.waitWsConnection(true);

          resolve();

        }

      }, 10000);

      EthWallet.providerWeb3Ws.connection.addEventListener('open', onOpen);

    });

  }

  static async closeNode(){

    EthWallet.web3 = null;
    EthWallet.web3Ws = null;
    EthWallet.providerEthers = null;
    EthWallet.initialize = false;
    EthWallet.providerWeb3Ws.connection.close();

    if(EthWallet.providerWeb3Ws.connection.readyState !== 3) { // already close

      await new Promise( (resolve) => {

        EthWallet.providerWeb3Ws.connection.addEventListener('close', () => resolve() );

      });

    }

    EthWallet.providerWeb3 = null;
    EthWallet.providerWeb3Ws = null;

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

  static async mine(){

    assert(EthWallet.initialize, 'node_not_initialize');

    await new Promise( (resolve, reject) => {

      EthWallet.web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_mine',
        id: Date.now()
      }, (err) => {

        if(err){

          reject();

        }

        resolve();

      });

    });

    return true;

  }

  static isValidAmount(value){

    try {

      const djsValue = new Decimal(value);

      return djsValue.isFinite();

    } catch (error){

      return false;

    }

  }

  static isValidAddress(address){

    return WebStatic.utils.isAddress(address);

  }

  static isMined(tx){

    return tx.status === 1;

  }

  waitMined(tx){

    return Utils.waitTx(tx.hash, this.walletClient.provider);

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
      const receipt = await this.waitMined(tx);

      return EthWallet.isMined(receipt);

    } catch(err){

      if(err.message.includes('sender doesn\'t have enough funds to send tx') ){

        Errors.throwError('not_enough_balance');

      }

      throw err;

    }

  }

}

EthWallet.initialize = false;
EthWallet.wsIsConnecting = false;
EthWallet.wsWaitConnection = [];
EthWallet.connectionErrors = ['ECONNREFUSED', 'Unexpected end of JSON input'];

module.exports = EthWallet;
