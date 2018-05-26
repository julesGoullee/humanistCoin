const fs = require('fs');
const path = require('path');

const Ethers = require('ethers');
const solcLoader = require('solc');
const linker = require('solc/linker');
const solc = solcLoader.setupMethods(require('./soljson-nightly.js') );
const Utils = require('../src/utils');

const ContractUtils = {

  findImports(fileName){

    if(fs.existsSync(path.join(__dirname, `../src/contracts/${fileName}`) ) ){

      return { contents: fs.readFileSync(path.join(__dirname, `../src/contracts/${fileName}`) ).toString() };

    } else {

      return { error: 'File not found' };

    }

  },

  getContractSource(name, links){

    const contractRaw = fs.readFileSync(path.join(__dirname, `../src/contracts/${name}.sol`) ).toString();

    const compiled = solc.compile({ sources: { [`${name}.sol`]: contractRaw } }, 1, ContractUtils.findImports);

    if(compiled.errors && compiled.errors.length > 0){

      if(compiled.errors.find(err => !err.includes('Warning') ) ){

        throw new Error(compiled.errors);

      } else {

        console.log(compiled.errors);

      }

    }

    const contractCompiled =  compiled.contracts[`${name}.sol:${Utils.capitalize(name)}`];

    links.forEach( (link) => {

      contractCompiled.bytecode = linker.linkBytecode(contractCompiled.bytecode, { [link.name]: link.address });

    });

    return contractCompiled;

  },

  async deployContract(ethWallet, name, args = [], links = []){

    const contractCompiled = ContractUtils.getContractSource(name, links);
    const contractInterface = JSON.parse(contractCompiled.interface);

    const deployTransaction = Ethers.Contract.getDeployTransaction(
      '0x' + contractCompiled.bytecode,
      contractInterface,
      ...args
    );

    const constructorEncoded = deployTransaction.data.split(contractCompiled.bytecode)[1];
    console.log(name, 'constructorEncoded', constructorEncoded);

    if(contractInterface.length > 0){

      const pathInterface = path.join(__dirname, `../src/contracts/${name}.interface.json`);
      fs.writeFileSync(pathInterface, JSON.stringify(contractInterface, null, 2) );

    }

    const tx = await ethWallet.walletClient.sendTransaction({
      data: deployTransaction.data,
      gasPrice: await ethWallet.walletClient.provider.getGasPrice(),
      gasLimit: 4000000
    });

    await Utils.waitTx(tx.hash, ethWallet.constructor.providerEthers);
    const receipt = await ethWallet.constructor.providerEthers.getTransactionReceipt(tx.hash);

    return new Ethers.Contract(receipt.contractAddress, contractInterface, ethWallet.walletClient);

  }

};

module.exports = ContractUtils;
