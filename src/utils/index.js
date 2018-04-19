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

};

module.exports = Utils;
