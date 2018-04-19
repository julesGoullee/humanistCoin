const Ethers = require('ethers');
const log = require('npmlog');

const config = require('../../config');
const abi = require('../../../contracts/humanist.interface');
const Db = require('../../modules/db');

const providerEthers = new Ethers.providers.JsonRpcProvider(
  'http' + config.NODE_URL,
  'kovan'
);

const StateWatcher = {

  start(){

    log.info('state watcher', 'start');
    StateWatcher.contract = new Ethers.Contract(config.CONTRACT_ADDRESS, abi, providerEthers);
    StateWatcher.contract.onvalidatehuman = (address, state) => {

      log.info('state watcher', { address, state });
      Db.removeByProp('address', address);

    };

    return true;

  },

  stop(){

    if(StateWatcher.contract.onvalidatehuman){

      StateWatcher.contract.onvalidatehuman = null;

    }

    if(StateWatcher.contract){

      StateWatcher.contract = null;

    }

    return true;

  }

};

module.exports = StateWatcher;
