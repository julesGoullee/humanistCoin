const Ethers = require('ethers');
const assert = require('assert');
const _D = require('decimal.js');
const Decimal = _D.default || _D;
const humanistInterface = require('./contracts/humanist.interface');
const EventEmitter = require('events');
const Errors = require('./utils/errors');

class Humanist extends EventEmitter{

  constructor(ethWallet, contract){

    super();
    assert(ethWallet.opened, 'not_opened_eth_wallet');
    this.ethWallet = ethWallet;
    this.contract = contract;
    this.web3ContractWs = new this.ethWallet.constructor.web3Ws.eth.Contract(
      this.contract.interface.abi,
      this.contract.address);
    this.web3Contract = new this.ethWallet.constructor.web3.eth.Contract(
      this.contract.interface.abi,
      this.contract.address);
    this.listening = false;
    this.blockListener = this.blockListener.bind(this);
    this.getTransaction = this.getTransaction.bind(this);

  }

  static getContract(address, ethWallet){

    return new Ethers.Contract(address, humanistInterface, ethWallet.walletClient);

  }

  close(){

    if(this.listening){

      this.contract.onvalidatehuman = null;
      this.listening = false;
      this.ethWallet.constructor.providerEthers.removeListener('block', this.blockListener);

      try {

        this.web3ContractWs.clearSubscriptions(false);

      } catch(error){

        console.error(error);

      }

    }

  }

  async blockListener(){

    const balance = await this.balance();

    if(balance){

      this.emit('balance', balance);

    }

  }

  async listen(){

    if(this.listening){

      return false;

    }

    this.contract.onvalidatehuman = (address, state) => {

      this.emit('validate', { address, state });

    };

    const handler = async (error, event) => {

      if(error){

        console.log(error);

      } else {

        const tx = await this.getTransaction(event);

        this.emit('tx', tx);

      }

    };

    const listenTx = () => {

      console.log('humanist listen tx');
      this.web3ContractWs = new this.ethWallet.constructor.web3Ws.eth.Contract(
        this.contract.interface.abi,
        this.contract.address);
      this.web3ContractWs.once('Transfer', {
        filter: {
          from: this.ethWallet.data.address
        }
      }, handler);

      this.web3ContractWs.once('Transfer', {
        filter: {
          to: this.ethWallet.data.address
        }
      }, handler);

    };

    const onClose = async () => {

      if(this.ethWallet.constructor.initialize){

        await this.ethWallet.constructor.waitWsConnection();

        listenTx();

        this.ethWallet.constructor.providerWeb3Ws.connection.addEventListener('close', onClose);

      }

    };

    listenTx();
    this.ethWallet.constructor.providerWeb3Ws.connection.addEventListener('close', onClose);

    this.ethWallet.constructor.providerEthers.on('block', this.blockListener);

    this.listening = true;

  }

  async add({ birthday, email, id, amount = Humanist.addMinAmount }){

    assert(new Decimal(amount).gte(Humanist.addMinAmount), 'insufficient_amount');

    const feeEth = '0.01';
    const ethNeed = new Decimal(amount).add(feeEth).toString();
    assert(await this._haveEthAmount(ethNeed), 'insufficient_fund_eth' );

    try {

      const tx = await this.contract.add(
        birthday,
        email,
        id, {
          value: Ethers.utils.parseEther(amount),
          gasPrice: await this.ethWallet.walletClient.provider.getGasPrice(),
          gasLimit: 4000000 // todo estimate
        });

      const receipt = await this.ethWallet.waitMined(tx);

      return this.ethWallet.constructor.isMined(receipt); // false: humanist_already_exist

    } catch (error){

      if(Humanist.isBlockchainExecError(error) ){

        return false; // humanist_already_exist

      }

      Errors.throwError('unknown_blockchain_error', { error });

    }

  }

  async balance(){

    try {

      const balance = await this.contract.balanceOf(this.ethWallet.data.address);

      return Ethers.utils.formatEther(balance).toString();

    } catch (error){

      if(Humanist.isBlockchainExecError(error) ){

        return null;

      }

      console.log(error);
      Errors.throwError('unknown_blockchain_error', { error });

    }

  }

  async me(){

    try {

      const data = await this.contract.me();

      return {
        birthday: data[0].toString(),
        hash: data[1].toString(),
        createdAt: data[2].toString(),
        validate: data[3]
      };

    } catch (error){

      if(Humanist.isBlockchainExecError(error) ||
        error.message.includes('invalid data for function output') ||
        error.message.includes('invalid hexlify value') ){

        console.warn(error.message);

        return null;

      }

      console.log(error);

      return null;

      // throw new Error('unknown_error');

    }

  }

  async send(address, value){

    assert(this.ethWallet.constructor.isValidAmount(value), 'invalid_amount');
    assert(this.ethWallet.constructor.isValidAddress(address), 'invalid_address');
    assert(await this._haveEthAmount('0.001'), 'insufficient_fund_eth' );
    assert(await this._haveAmount(value), 'insufficient_fund' );

    try {

      const tx = await this.contract.transfer(address, Ethers.utils.parseEther(value) );
      const receipt = await this.ethWallet.waitMined(tx);

      return this.ethWallet.constructor.isMined(receipt);

    } catch (error){

      if(Humanist.isBlockchainExecError(error) ){

        return false;

      }

      console.log(error);
      Errors.throwError('unknown_blockchain_error', { error });

    }

  }

  async getTransaction(event){

    const tx = await this.ethWallet.constructor.web3.eth.getTransaction(event.transactionHash);

    const data = {
      from: event.returnValues.from,
      to: event.returnValues.to,
      amount: Ethers.utils.formatEther(event.returnValues.tokens).toString(),
      fee: Ethers.utils.formatEther(new Decimal(tx.gas).mul(tx.gasPrice).toString() ).toString(),
      blockNumber: event.blockNumber,
      blockHash: event.blockHash,
      transactionHash: event.transactionHash,
    };

    if(data.from === this.ethWallet.data.address){

      data.type = 'out';

    } else if(data.to === this.ethWallet.data.address){

      data.type = 'in';

    } else {

      Errors.throwError('unknown_tx_type', { data, tx });

    }

    return data;

  }

  async txHistory(){

    const eventsTo = await new Promise( (resolve, reject) => {

      this.web3Contract.getPastEvents('Transfer', {
        filter: {
          to: this.ethWallet.data.address
        },
        fromBlock: 0,
        toBlock: 'latest'
      }, async (error, events) => {

        if(error){

          return reject(error);

        }

        resolve(events);

      });

    });

    const eventsFrom = await new Promise( (resolve, reject) => {

      this.web3Contract.getPastEvents('Transfer', {
        filter: {
          from: this.ethWallet.data.address
        },
        fromBlock: 0,
        toBlock: 'latest'
      }, async (error, events) => {

        if(error){

          return reject(error);

        }

        resolve(events);

      });

    });

    const txs = await Promise.all(eventsTo.concat(eventsFrom).map(this.getTransaction) );

    return txs.sort( (a, b) => a.blockNumber > b.blockNumber ? 1 : -1);

  }

  async totalSupply(){

    try {

      const res = await this.contract.totalSupply();

      return Ethers.utils.formatEther(res.toString() );

    } catch (error){

      if(Humanist.isBlockchainExecError(error) ){

        return false;

      }

      console.log(error);
      Errors.throwError('unknown_blockchain_error', { error });

    }

  }

  static isBlockchainExecError(error){

    return error.message === Humanist.blockchainExecError;

  }

  async _haveEthAmount(amount){

    const balance = await this.ethWallet.balance();

    return new Decimal(balance).gte(amount);

  }

  async _haveAmount(amount){

    const balance = await this.balance();
    return new Decimal(balance).gte(amount);

  }

}

Humanist.blockchainExecError = 'VM Exception while processing transaction: revert';
Humanist.addMinAmount = '0.1';

module.exports = Humanist;
