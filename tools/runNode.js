require('dotenv').config();
const Web3 = require('web3');

const Node = require('./node');
const EthWallet = require('../src/ethWallet');

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
  const faucetEthWallet = new EthWallet({privateKey: faucetPrivateKey});
  await faucetEthWallet.open();
  await faucetEthWallet.send(ethWalletOwner.data.address, '1');
  await faucetEthWallet.send('0x507bbd38e0E5461495e6d6c6aA527F4f3c16b4F9', '1');

  const ethWallet = new EthWallet({
    // 0x68AF31aFf3fd7C1E00c89825035abD93E3B5086e
    privateKey: '0xc15145a17b4f20c5365c72eeb5b91fb137e8768f549dd22563d2ddb62c8d7f5e'
  });
  await ethWallet.open();
  await faucetEthWallet.send(ethWallet.data.address, '1');

  const ethWallet1 = new EthWallet({
    // 0xE4EE98033161E6f2989C1bCB2267bc13993FA1EB
    privateKey: '0xb45d72990799ff01f5c9f87732bac7b8818163005b6552ea90973d1ed39a1cfa'
  });await ethWallet1.open();
  await faucetEthWallet.send(ethWallet1.data.address, '1');

  const ethWallet2 = new EthWallet({
    // 0xf10B792aBDCaE52e149C32405Bd7658fc6236536
    privateKey: '0xf7af7eb037b080d39ca9055b9fc3f6c9db4a100e2d7c2e9ffef139911e5bd3fd'
  });
  await ethWallet2.open();
  await faucetEthWallet.send(ethWallet2.data.address, '1');
  console.log('started');

})().catch(error => console.error(error) );
