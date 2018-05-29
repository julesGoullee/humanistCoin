const Ethers = require('ethers');
const log = require('npmlog');

const config = require('../../../config');
const abi = require('../../../contracts/humanist.interface');
const Db = require('../../modules/db');

const providerEthers = new Ethers.providers.JsonRpcProvider(
  config.NODE_URL,
  config.NETWORK
);

const StatusWatcher = {

  start(){

    log.info('status watcher', 'start');
    StatusWatcher.contract = new Ethers.Contract(config.CONTRACT_ADDRESS, abi, providerEthers);
    StatusWatcher.contract.onvalidatehuman = (address, status) => {

      log.info('status watcher', { address, status });

      if(status){

        Db.removeByProp('address', address);

      }

    };

    return true;

  },

  stop(){

    if(StatusWatcher.contract.onvalidatehuman){

      StatusWatcher.contract.onvalidatehuman = null;

    }

    if(StatusWatcher.contract){

      StatusWatcher.contract = null;

    }

    return true;

  }

};

module.exports = StatusWatcher;
