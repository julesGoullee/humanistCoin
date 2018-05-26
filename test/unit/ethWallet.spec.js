const path = require('path');

const Web3 = require('web3');
const EthWallet = require(path.join(srcDir, '/ethWallet') );
const ContractUtils = require(path.join(srcDir, '../tools/contract') );
const Node = require(path.join(srcDir, '../tools/node') );
const Utils = require(path.join(srcDir, '/utils') );

describe('EthWallet', () => {

  beforeEach( async () => {

    this.sandbox = createSandbox();

  });

  afterEach( async () => {

    this.sandbox.restore();

  });

  it('Should generateKeyPair', () => {

    const keyPair = EthWallet.generateKeypair();
    expect(keyPair.privateKey).to.exist;
    expect(keyPair.publicKey).to.exist;
    expect(keyPair.address).to.exist;

  });

  it('Should validate keyPair', () => {

    expect(EthWallet.validatePrivateKey('0xc15145a17b4f20c5365c72eeb5b91fb137e8768f549dd22563d2ddb62c8d7f5e')
    ).to.be.true;
    expect(EthWallet.validatePrivateKey('0xc15145a17b4f')
    ).to.be.false;
    expect(EthWallet.validatePrivateKey('axc15145a17b4f20c5365c72eeb5b91fb137e8768f549dd22563d2ddb62c8d7f5e')
    ).to.be.false;
    expect(EthWallet.validatePrivateKey('zxc15145a17b4f20c5365c72eeb5b91fb137e8768f549dd22563d2ddb62c8d7f5e')
    ).to.be.false;
  });

  it('Cannot create before init', () => {

    expect(() => new EthWallet() ).to.throw('node_not_initialize');

  });

  it('Should validate amount', () => {

    expect(EthWallet.isValidAmount('1')
    ).to.be.true;
    expect(EthWallet.isValidAmount('1.1')
    ).to.be.true;
    expect(EthWallet.isValidAmount('a')
    ).to.be.false;
    expect(EthWallet.isValidAmount('1,1')
    ).to.be.false;
  });

  it('Should validate address', () => {

    expect(EthWallet.isValidAddress('0xf10B792aBDCaE52e149C32405Bd7658fc6236536')
    ).to.be.true;
    expect(EthWallet.isValidAddress('0xf10B792aBDCaE52e149C32405Bd7658fc6236537')
    ).to.be.false;
    expect(EthWallet.isValidAddress('a')
    ).to.be.false;
  });

  it('Should check tx isMined', () => {

    expect(EthWallet.isMined({ status: 1 }) ).to.be.true;
    expect(EthWallet.isMined({ status: 0 }) ).to.be.false;

  });

  it('Cannot init without node', async () => {

    await expect(EthWallet.initNode() )
      .to.be.rejectedWith(Error, 'node_connection_error');

  });

  describe('With node', () => {

    beforeEach( async () => {

      this.faucerPrivateKey = '0x0123456789012345678901234567890123456789012345678901234567890123';
      this.node = new Node({
        accounts: [
          {
            secretKey: this.faucerPrivateKey,
            balance: Web3.utils.toWei('10')
          }
        ]
      });
      await this.node.start();
    });

    afterEach( async () => {

      await this.node.stop();

    });

    it('Should init and close node', async () => {

      expect(EthWallet.providerWeb3).not.to.exist;
      expect(EthWallet.providerWeb3Ws).not.to.exist;
      expect(EthWallet.web3).not.to.exist;
      expect(EthWallet.web3Ws).not.to.exist;
      expect(EthWallet.providerEthers).not.to.exist;
      expect(EthWallet.initialize).to.be.false;
      await EthWallet.initNode();
      expect(EthWallet.providerWeb3).to.exist;
      expect(EthWallet.web3).to.exist;
      expect(EthWallet.providerEthers).to.exist;
      expect(EthWallet.initialize).to.be.true;
      await EthWallet.closeNode();
      expect(EthWallet.providerWeb3).not.to.exist;
      expect(EthWallet.providerWeb3Ws).not.to.exist;
      expect(EthWallet.web3).not.to.exist;
      expect(EthWallet.web3Ws).not.to.exist;
      expect(EthWallet.providerEthers).not.to.exist;
      expect(EthWallet.initialize).to.be.false;

    });

    describe('with node initialize', () => {

      beforeEach( async () => {

        await EthWallet.initNode();
        this.ethWalletOwner = new EthWallet();
        await this.ethWalletOwner.open();
        this.faucetEthWallet = new EthWallet({ privateKey: this.faucerPrivateKey });
        await this.faucetEthWallet.open();

      });

      afterEach( async () => {

        await EthWallet.closeNode();

      });

      it('Should wait tx', async () => {

        const stubUtilsWaitTx = this.sandbox.stub(Utils, 'waitTx').resolves('receipt');
        const receipt = await this.ethWalletOwner.waitMined({ hash: 'hash'});
        expect(receipt).to.eq('receipt');
        expect(stubUtilsWaitTx.calledOnce).to.be.true;
        expect(stubUtilsWaitTx.args[0][0]).to.eq('hash');
        expect(stubUtilsWaitTx.args[0][1]).to.eq(this.ethWalletOwner.walletClient.provider);

      });

      it('Should send', async () => {

        await this.faucetEthWallet.send(this.ethWalletOwner.data.address, '1');
        const balance = await this.ethWalletOwner.balance();

        expect(balance).to.eq('1.0');

      });

      it('Should mine', async () => {

        const blockNumber = await EthWallet.providerEthers.getBlockNumber();
        const res = await EthWallet.mine();

        expect(res).to.be.true;
        const blockNumber1 = await EthWallet.providerEthers.getBlockNumber();

        expect(blockNumber1).to.eq(blockNumber + 1);

        const res1 = await EthWallet.mine();

        expect(res1).to.be.true;
        const blockNumber2 = await EthWallet.providerEthers.getBlockNumber();

        expect(blockNumber2).to.eq(blockNumber1 + 1);
      });

      describe('With ethWalletOwner with amount', async () => {

        beforeEach( async () => {

          this.contractTypes = await ContractUtils.deployContract(this.faucetEthWallet, 'types');
          this.contractStore = await ContractUtils.deployContract(this.faucetEthWallet, 'store', [], [{
            name: 'Types',
            address: this.contractTypes.address
          }]);

          await this.faucetEthWallet.send(this.ethWalletOwner.data.address, '1');

        });

        it('Should deploy without verification', async () => {

          expect(this.contractStore.address).to.be.a.string;
          const params = [
            100,
            false,
            this.contractStore.address,
            'not-working-url',
            '0x0000000000000000000000000000000000000000'
          ];
          const contract = await ContractUtils.deployContract(this.ethWalletOwner, 'humanist', params, [{
            name: 'Types',
            address: this.contractTypes.address
          }]);
          expect(contract.address).to.be.a.string;

        });

        it('Should deploy with verification', async () => {

          const params = [
            100,
            true,
            this.contractStore.address,
            'not-working-url',
            '0x0000000000000000000000000000000000000000'
          ];
          const contract = await ContractUtils.deployContract(this.ethWalletOwner, 'humanist', params, [{
            name: 'Types',
            address: this.contractTypes.address
          }]);
          expect(contract.address).to.be.a.string;

        });

      });

    });

  });

});
