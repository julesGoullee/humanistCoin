const Ethers = require('ethers');
const assert = require('assert');
const _D = require('decimal.js');
const Decimal = _D.default || _D;
const humanistInterface = require('./contracts/humanist.interface');

class Humanist {

  constructor(ethWallet, contract){

    assert(ethWallet.opened, 'not_opened_eth_wallet');
    this.ethWallet = ethWallet;
    this.contract = contract;
    this.waitMining = false;

  }

  static getContract(address, ethWallet){

    return new Ethers.Contract(address, humanistInterface, ethWallet.walletClient);

  }

  async close(){

    if(this.contract.onvalidatehuman){

      this.contract.onvalidatehuman = null;

    }

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

      await this._waitMined(tx);

      return true;

    } catch (error){

      if(Humanist.isBlockchainExecError(error) ){

        return false; // humanist_already_exist

      }

      throw new Error('unknown_error', error);

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

      throw new Error('unknown_error');

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

      if(Humanist.isBlockchainExecError(error) ){

        return null;

      }

      throw new Error('unknown_error');

    }

  }

  async send(address, value){

    try {

      assert(await this._haveEthAmount('0.001'), 'insufficient_fund_eth' );
      assert(await this._haveAmount(value), 'insufficient_fund' );

      const tx = await this.contract.transfer(address,  Ethers.utils.parseEther(value) );

      await this._waitMined(tx);

      return true;

    } catch (error){

      if(Humanist.isBlockchainExecError(error) ){

        return false;

      }

      throw new Error('unknown_error');

    }

  }

  async totalSupply(){

    try {

      const res = await this.contract.totalSupply();

      return Ethers.utils.formatEther(res.toString() );

    } catch (error){

      if(Humanist.isBlockchainExecError(error) ){

        return false;

      }

      throw new Error('unknown_error');

    }

  }

  static isBlockchainExecError(error){

    return error.message === Humanist.blockchainExecError;

  }

  async _waitMined(tx){

    if(this.waitMining){

      await this.ethWallet.walletClient.provider.waitForTransaction(tx.hash);

    }

    return true;

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
