require('dotenv').config();
const config = require('../src/config');
const EthWallet = require('../src/ethWallet');
const ContractUtils = require('./contract');
const moment = require('moment');
const Ethers = require('ethers');
const contractStoreInterface = require('../src/contracts/store.interface');
const Utils = require('../src/utils');

(async () => {

  let {
    PRIVATE_KEY,
    CONTRACT_TYPES_ADDRESS,
    CONTRACT_STORE_ADDRESS,
    CONTRACT_ADDRESS,
  } = process.env;

  if(!PRIVATE_KEY){

    throw new Error('missing_private_key');

  }

  await EthWallet.initNode();
  const ethWallet = new EthWallet({ privateKey: PRIVATE_KEY });
  await ethWallet.open();

  const balance = await ethWallet.balance();
  console.log('Started', {
    address: ethWallet.data.address,
    balance
  });

  let contractTypes = null;
  let contractStore = null;
  let contractHumanist = null;

  if(!CONTRACT_TYPES_ADDRESS){

    console.log('Deploy contract types...');
    contractTypes = await ContractUtils.deployContract(ethWallet, 'types');
    console.log('Contract types deployed', {
      address: contractTypes.address
    });

  }

  if(!CONTRACT_STORE_ADDRESS){

    console.log('Deploy contract store...');
    contractStore = await ContractUtils.deployContract(ethWallet, 'store', [], [{
      name: 'Types',
      address: CONTRACT_TYPES_ADDRESS || contractTypes.address
    }]);
    console.log('Contract store deployed', {
      address: contractStore.address
    });

  }

  if( !CONTRACT_ADDRESS && (CONTRACT_TYPES_ADDRESS || contractTypes) &&
    (CONTRACT_STORE_ADDRESS || contractStore) ){

    const esperance = parseInt(moment.duration(84, 'years').asSeconds() / 5, 10);

    const params = [
      esperance,
      config.RUN.VERIFY,
      CONTRACT_STORE_ADDRESS || contractStore.address,
      config.API.BASE_URL,
      '0x0000000000000000000000000000000000000000'
    ];

    console.log('Deploy contract humanist...', params);
    contractHumanist = await ContractUtils.deployContract(ethWallet, 'humanist', params, [{
      name: 'Types',
      address: CONTRACT_TYPES_ADDRESS || contractTypes.address
    }] );
    console.log('Contract humanist deployed', {
      address: contractHumanist.address
    });

  }

  if(!contractStore){

    contractStore = new Ethers.Contract(CONTRACT_STORE_ADDRESS, contractStoreInterface, ethWallet.walletClient);

  }

  console.log('setConsumer...');

  const tx = await contractStore.setConsumer(contractHumanist ? contractHumanist.address : CONTRACT_ADDRESS);

  await Utils.waitTx(tx.hash, EthWallet.providerEthers);

  console.log('Done!');

  process.exit(0);

})().catch(error => console.error(error) );
