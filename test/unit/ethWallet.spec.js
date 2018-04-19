const path = require('path');

const Web3 = require('web3');
const EthWallet = require(path.join(srcDir, '/ethWallet') );
const ContractUtils = require(path.join(srcDir, '../tools/contract') );
const Node = require(path.join(srcDir, '../tools/node') );

describe('EthWallet', () => {

  beforeEach( async () => {

    this.sandbox = sandbox.create();

  });

  afterEach( async () => {

    this.sandbox.restore();

  });

  it('Should generateKeyPair', () => {

    const keyPair = EthWallet.generateKeypair();
    console.log(keyPair.privateKey);
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

    it('Should init and close node', async () => {

      expect(EthWallet.providerWeb3).not.to.exist;
      expect(EthWallet.web3).not.to.exist;
      expect(EthWallet.providerEthers).not.to.exist;
      expect(EthWallet.initialize).to.be.false;
      await EthWallet.initNode();
      expect(EthWallet.providerWeb3).to.exist;
      expect(EthWallet.web3).to.exist;
      expect(EthWallet.providerEthers).to.exist;
      expect(EthWallet.initialize).to.be.true;
      await EthWallet.closeNode();
      expect(EthWallet.providerWeb3).not.to.exist;
      expect(EthWallet.web3).not.to.exist;
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

      it('Should send', async () => {

        await this.faucetEthWallet.send(this.ethWalletOwner.data.address, '1');
        const balance = await this.ethWalletOwner.balance();

        expect(balance).to.eq('1.0');

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

      });

    });

    afterEach( async () => {

      await this.node.stop();

    });

  });

});
