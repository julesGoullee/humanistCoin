const Web3 = require('web3');

const config = require('../src/oracleApi/config');
const Tunnel = require('./httpTunnel');
const Utils = require('../src/utils');
const Node = require('./node');
const Humanist = require('../src/humanist');
const EthWallet = require('../src/ethWallet');
const App = require('../src/oracleApi/services/api/app');
const StateWatcher = require('../src/oracleApi/services/blockchains/stateWatcher');
const OraclizeBridge = require('./oraclizeBridge');
const ContractUtils = require('./contract');
const moment = require('moment');

(async () => {

  const faucetPrivateKey = '0x0123456789012345678901234567890123456789012345678901234567890123';
  const oraclizePrivateKey = '0x0123456789012345678901234567890123456789012345678901234567890124';

  const node = new Node({
    debug: true,
    logger: console,
    accounts: [
      {
        secretKey: oraclizePrivateKey,
        balance: Web3.utils.toWei('100')
      },
      {
        secretKey: faucetPrivateKey,
        balance: Web3.utils.toWei('10')
      }
    ]
  });
  await node.start();
  await EthWallet.initNode();
  const ethWalletOwner = new EthWallet();
  await ethWalletOwner.open();
  const faucetEthWallet = new EthWallet({ privateKey: faucetPrivateKey });
  await faucetEthWallet.open();
  await faucetEthWallet.send(ethWalletOwner.data.address, '1');

  let contractOwner = null;
  const contractTypes = await ContractUtils.deployContract(ethWalletOwner, 'types');
  const contractStore = await ContractUtils.deployContract(ethWalletOwner, 'store', [], [{
    name: 'Types',
    address: contractTypes.address
  }]);

  if(config.RUN.VERIFY){

    const oraclizeBridge = new OraclizeBridge();
    const oraclizeAddress = await oraclizeBridge.start();
    const urlTunnel = await Tunnel.start();

    const params = [
      100,
      true,
      contractStore.address,
      urlTunnel,
      oraclizeAddress
    ];
    contractOwner = await ContractUtils.deployContract(ethWalletOwner, 'humanist', params, [{
      name: 'Types',
      address: contractTypes.address
    }] );

    await StateWatcher.start();
    await App.start();

    process.on('SIGTERM', async () => {

      await StateWatcher.stop();
      await App.stop();
      await oraclizeBridge.stop();
      await Tunnel.stop();

    });

  } else {

    const esperance = parseInt(moment.duration(84, 'years').seconds() / 5, 10);
    const params = [
      esperance,
      false,
      contractStore.address,
      'not-working-url',
      '0x0000000000000000000000000000000000000000'
    ];

    contractOwner = await ContractUtils.deployContract(ethWalletOwner, 'humanist', params, [{
      name: 'Types',
      address: contractTypes.address
    }] );

    await App.start();

    process.on('SIGTERM', async () => {

      await App.stop();

    });

  }

  await contractStore.setConsumer(contractOwner.address);

  config.CONTRACT_ADDRESS = contractOwner.address;

  const ethWallet = new EthWallet({
    // 0x68AF31aFf3fd7C1E00c89825035abD93E3B5086e
    privateKey: '0xc15145a17b4f20c5365c72eeb5b91fb137e8768f549dd22563d2ddb62c8d7f5e'
  });
  await ethWallet.open();
  await faucetEthWallet.send(ethWallet.data.address, '1');
  const humanist = new Humanist(ethWallet, Humanist.getContract(contractOwner.address, ethWallet) );
  const ethWallet1 = new EthWallet({
    // 0xE4EE98033161E6f2989C1bCB2267bc13993FA1EB
    privateKey: '0xb45d72990799ff01f5c9f87732bac7b8818163005b6552ea90973d1ed39a1cfa'
  });
  await ethWallet1.open();
  await faucetEthWallet.send(ethWallet1.data.address, '1');
  const humanist1 = new Humanist(ethWallet1, Humanist.getContract(contractOwner.address, ethWallet1) );

  const ethWallet2 = new EthWallet({
    // 0xf10B792aBDCaE52e149C32405Bd7658fc6236536
    privateKey: '0xf7af7eb037b080d39ca9055b9fc3f6c9db4a100e2d7c2e9ffef139911e5bd3fd'
  });
  await ethWallet2.open();
  await faucetEthWallet.send(ethWallet2.data.address, '1');

  if(!config.RUN.VERIFY){

    await humanist.add({
      birthday: Utils.nowInSecond(),
      email: 'email@email.com',
      id: 'id'
    });

    await humanist1.add({
      birthday: Utils.nowInSecond(),
      email: 'email1@email.com',
      id: 'id1'
    });

  }

  console.log('contract address:', contractOwner.address);
  console.log('humanist', ethWallet.data);
  console.log('humanist1', ethWallet1.data);
  console.log('wallet without humanist', ethWallet2.data);
  console.log('started');

})().catch(error => console.error(error) );
