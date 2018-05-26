const Decimal = require('decimal.js');

const Utils = {

  capitalize(s) {

    return s[0].toUpperCase() + s.slice(1);

  },

  valueDecrease(value, blockCreation, blockNow, esperance){

    const old = new Decimal(blockNow).add(1).sub(blockCreation); // lifetime asset
    const burnedAmount = new Decimal(value).mul(old).div(esperance);

    return new Decimal(value).sub(burnedAmount);

  },

  getTransferValue(value, blockCreation, blockTransfer, blockNow, esperance){

    const old = new Decimal(blockTransfer).add(1).sub(blockCreation); // lifetime asset
    const timeRemind = new Decimal(esperance).sub(old);
    const rawValue = new Decimal(value).mul(esperance).div(timeRemind);

    return Utils.valueDecrease(rawValue, blockCreation, blockNow, esperance);

  },

  nowInSecond(){

    return parseInt(Date.now() / 1000, 10);

  },

  wait(ms){

    return new Promise(res => setTimeout(res, ms) );

  },

  async waitTx(hash, provider){

    let receipt = await provider.getTransactionReceipt(hash);

    if(!receipt){

      try {

        await provider.waitForTransaction(hash, 9 * 60 * 1000);

        receipt = await provider.getTransactionReceipt(hash);

      } catch(error){

        if(error.message === 'timeout'){

          console.log('wait timeout');
          return false;

        } else if(error.message.includes('CONNECTION ERROR') ){

          console.warn('wait tx disconnect retry...');
          console.error(error);
          return Utils.waitTx(hash, provider);

        } else {

          throw error;

        }

      }

    }

    return receipt;

  }

};

module.exports = Utils;
