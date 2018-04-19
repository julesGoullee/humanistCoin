const path = require('path');

const Web3 = require('web3');
const Decimal = require('decimal.js');

const Node = require(path.join(srcDir, '../tools/node') );
const OraclizeBridge = require(path.join(srcDir, '../tools/oraclizeBridge') );

const config = require('../../src/oracleApi/config');
const EthWallet = require(path.join(srcDir, '/ethWallet') );
const ContractUtils = require(path.join(srcDir, '../tools/contract') );
const Tunnel = require(path.join(srcDir, '../tools/httpTunnel') );
const Humanist = require(path.join(srcDir, '/humanist') );
const Utils = require(path.join(srcDir, '/utils') );
const UtilsApi = require(path.join(srcDir, '/oracleApi/utils') );
const App = require(path.join(srcDir, '/oracleApi/services/api/app') );
const StateWatcher = require(path.join(srcDir, '/oracleApi/services/blockchains/stateWatcher') );
const Db = require(path.join(srcDir, '/oracleApi/modules/db') );
const apiClient = require(path.join(srcDir, '/apiClient') );
const InterfaceValidator = require(path.join(srcDir, '/oracleApi/modules/validators/interface') );

describe('Humanist', () => {

  beforeEach( async () => {

    this.sandbox = sandbox.create();

    this.faucerPrivateKey = '0x0123456789012345678901234567890123456789012345678901234567890123';
    this.oraclizePrivateKey = '0x0123456789012345678901234567890123456789012345678901234567890124';
    this.node = new Node({
      debug: true,
      logger: console,
      accounts: [
        {
          secretKey: this.oraclizePrivateKey,
          balance: Web3.utils.toWei('100')
        },
        {
          secretKey: this.faucerPrivateKey,
          balance: Web3.utils.toWei('100')
        }
      ]
    });
    await this.node.start();
    await EthWallet.initNode();

    this.faucetEthWallet = new EthWallet({ privateKey: this.faucerPrivateKey });
    await this.faucetEthWallet.open();

    this.ethWalletOwner = new EthWallet();
    await this.ethWalletOwner.open();

    await this.faucetEthWallet.send(this.ethWalletOwner.data.address, '1');

    this.esperance = 100;
    this.initBalance = new Decimal('1');
    this.contractTypes = await ContractUtils.deployContract(this.ethWalletOwner, 'types');

  });

  afterEach( async () => {

    await this.node.stop();
    this.sandbox.restore();

  });

  it('Should have min amount and exec error', () => {

    expect(Humanist.blockchainExecError).to.exist;
    expect(Humanist.addMinAmount).to.exist;

  });

  describe('Without validation', async () => {

    beforeEach( async () => {

      this.contractStore = await ContractUtils.deployContract(this.ethWalletOwner, 'store', [], [{
        name: 'Types',
        address: this.contractTypes.address
      }]);

      const params = [
        100,
        false,
        this.contractStore.address,
        'not-working-url',
        '0x0000000000000000000000000000000000000000'
      ];
      this.contractHumanist = await ContractUtils.deployContract(this.ethWalletOwner, 'humanist', params, [{
        name: 'Types',
        address: this.contractTypes.address
      }]);

      await this.contractStore.setConsumer(this.contractHumanist.address);

      this.ethWallet = new EthWallet();
      await this.ethWallet.open();

      await this.faucetEthWallet.send(this.ethWallet.data.address, '1');
      this.humanist = new Humanist(
        this.ethWallet,
        Humanist.getContract(this.contractHumanist.address, this.ethWallet)
      );

      this.configOldContract = config.CONTRACT_ADDRESS;
      config.CONTRACT_ADDRESS = this.contractHumanist.address;

    });

    afterEach( () => {

      config.CONTRACT_ADDRESS = this.configOldContract;
      this.humanist.close();

    });

    it('Should add', async () => {

      const balance = await this.humanist.balance();
      expect(balance).to.eq('1.0' );

      const res = await this.humanist.add({
        birthday: Utils.nowInSecond(),
        email: 'email@email.com',
        id: 'id'
      });

      expect(res).to.be.true;
      const balanceAfter = await this.humanist.balance();

      const blockNumber = await this.ethWallet.walletClient.provider.getBlockNumber();
      const expectValue = Utils.valueDecrease(
        balance, blockNumber, blockNumber,
        this.esperance);

      expect(balanceAfter).to.eq(expectValue.toDP(18, Decimal.ROUND_CEIL).toString() );

    });

    it('Should add with old greater than esperance', async () => {

      const balance = await this.humanist.balance();
      expect(balance).to.eq('1.0' );


      const res = await this.humanist.add({
        birthday: 730162800, // Sat Feb 20 1993 00:00:00 GMT+0100 (CET)
        email: 'email@email.com',
        id: 'id'
      });

      expect(res).to.be.true;
      const balanceAfter = await this.humanist.balance();

      expect(balanceAfter).to.eq('0.0');

    });

    it('Cannot add with insufficient amount', async () => {

      await expect(this.humanist.add({
        birthday: Utils.nowInSecond(),
        email: 'email@email.com',
        id: 'id',
        amount: '0.00000000001'
      }) ).to.be.rejectedWith(Error, 'insufficient_amount');

    });

    it('Should have amount', async () => {

      const res = await this.humanist._haveAmount('0.1');
      expect(res).to.be.true;
      const res1 = await this.humanist._haveAmount('1');
      expect(res1).to.be.true;
      const res2 = await this.humanist._haveAmount('1.1');
      expect(res2).to.be.false;

    });

    it('Should have amount', async () => {

      const res = await this.humanist._haveEthAmount('0.1');
      expect(res).to.be.true;
      const res1 = await this.humanist._haveEthAmount('1');
      expect(res1).to.be.true;
      const res2 = await this.humanist._haveEthAmount('1.1');
      expect(res2).to.be.false;

    });

    it('Cannot add with insufficient eth', async () => {

      await expect(this.humanist.add({
        birthday: Utils.nowInSecond(),
        email: 'email@email.com',
        id: 'id',
        amount: '100'
      }) ).to.be.rejectedWith(Error, 'insufficient_fund_eth');

    });

    it('Should get me', async () => {

      const now = Utils.nowInSecond();
      await this.humanist.add({
        birthday: now,
        email: 'email@email.com',
        id: 'id'
      });

      const me = await this.humanist.me();

      expect(me.createdAt).to.eq(now.toString() );
      expect(me.birthday).to.eq(now.toString() );
      expect(me.validate).to.be.true;
      expect(me.hash).to.exist;

    });

    it('Cannot get me with unknown account', async () => {

      const res = await this.humanist.me();
      expect(res).to.be.eq(null);

    });

    it('Cannot double add with same address', async () => {

      const res = await this.humanist.add({
        birthday: Utils.nowInSecond(),
        email: 'email@email.com',
        id: 'id'
      });
      expect(res).to.be.true;

      const res1 = await this.humanist.add({
        birthday: Utils.nowInSecond(),
        email: 'email1@email.com',
        id: 'id1'
      });

      expect(res1).to.be.eq(false);

    });

    it('Cannot double add with same identity', async () => {

      const birthday = Utils.nowInSecond();
      const res = await this.humanist.add({
        birthday,
        email: 'email@email.com',
        id: 'id'
      });
      expect(res).to.be.true;

      const ethWallet1 = new EthWallet();
      await ethWallet1.open();

      await this.faucetEthWallet.send(ethWallet1.data.address, '1');

      const humanist1 = new Humanist(ethWallet1, Humanist.getContract(this.contractHumanist.address, ethWallet1) );

      const res1 = await humanist1.add({
        birthday,
        email: 'email@email.com',
        id: 'id1'
      });

      await expect(res1).to.be.false;

    });

    it('Should decrease', async () => {

      await this.humanist.add({
        birthday: Utils.nowInSecond(),
        email: 'email@email.com',
        id: 'id'
      });
      const blockNumber = await this.ethWallet.walletClient.provider.getBlockNumber();

      await this.faucetEthWallet.send(this.ethWallet.data.address, '1');
      const balance = await this.humanist.balance();

      const expectValue = Utils.valueDecrease(
        this.initBalance.toString(), blockNumber,
        await this.ethWallet.walletClient.provider.getBlockNumber(),
        this.esperance);

      expect(balance)
        .to.eq(expectValue.toDP(18, Decimal.ROUND_CEIL).toString() );

      await this.faucetEthWallet.send(this.ethWallet.data.address, '1');

      const balance2 = await this.humanist.balance();

      const expectValue2 = Utils.valueDecrease(
        this.initBalance.toString(), blockNumber,
        await this.ethWallet.walletClient.provider.getBlockNumber(),
        this.esperance);

      expect(balance2)
        .to.eq(expectValue2.toDP(18, Decimal.ROUND_CEIL).toString() );

    });

    it('Cannot send without address', async () => {

      await this.humanist.add({
        birthday: Utils.nowInSecond(),
        email: 'email@email.com',
        id: 'id'
      });
      const ethWallet1 = new EthWallet();
      await ethWallet1.open();
      await this.faucetEthWallet.send(ethWallet1.data.address, '1');
      const humanist1 = new Humanist(ethWallet1, this.contractHumanist);

      const res = await humanist1.send(this.humanist.ethWallet.data.address, '0.01');
      expect(res).to.be.false;

    });

    it('Cannot send to unknown account', async () => {

      await this.humanist.add({
        birthday: Utils.nowInSecond(),
        email: 'email@email.com',
        id: 'id'
      });
      const ethWallet1 = new EthWallet();
      await ethWallet1.open();
      await this.faucetEthWallet.send(ethWallet1.data.address, '1');
      const humanist1 = new Humanist(ethWallet1, this.contractHumanist);

      const res = await this.humanist.send(humanist1.ethWallet.data.address, '0.01');
      expect(res).to.be.false;

    });

    it('Should send', async () => {

      await this.humanist.add({
        birthday: Utils.nowInSecond(),
        email: 'email@email.com',
        id: 'id'
      });
      const blockNumber = await this.ethWallet.walletClient.provider.getBlockNumber();

      const ethWallet1 = new EthWallet();
      await ethWallet1.open();

      await this.faucetEthWallet.send(ethWallet1.data.address, '1');

      const humanist1 = new Humanist(ethWallet1, Humanist.getContract(this.contractHumanist.address, ethWallet1) );
      await humanist1.add({
        birthday: Utils.nowInSecond(),
        email: 'email1@email.com',
        id: '1id'
      });

      const balance1Start = await humanist1.balance();

      const expectValue = Utils.valueDecrease(
        this.initBalance.toString(), blockNumber + 2,
        await this.ethWallet.walletClient.provider.getBlockNumber(),
        this.esperance);

      expect(balance1Start)
        .to.eq(expectValue.toDP(18, Decimal.ROUND_CEIL).toString() );

      const res = await humanist1.send(this.humanist.ethWallet.data.address, '0.01');
      expect(res).to.be.true;

      const balanceEnd = await this.humanist.balance();

      const expectValueEndInit = Utils.valueDecrease(
        this.initBalance.toString(),
        blockNumber,
        await this.ethWallet.walletClient.provider.getBlockNumber(),
        this.esperance);

      const expectValueEndTransfer = Utils.getTransferValue(
        '0.01',
        blockNumber + 2,
        blockNumber + 2,
        await this.ethWallet.walletClient.provider.getBlockNumber(),
        this.esperance);

      expect(balanceEnd)
        .to.eq(new Decimal(expectValueEndInit).add(expectValueEndTransfer).toDP(18, Decimal.ROUND_CEIL).toString() );


      const expectValue1EndInit = Utils.valueDecrease(
        this.initBalance.toString(),
        blockNumber + 2,
        await this.ethWallet.walletClient.provider.getBlockNumber(),
        this.esperance);

      const balance1End = await humanist1.balance();
      expect(balance1End)
        .to.eq(new Decimal(expectValue1EndInit).sub(expectValueEndTransfer).toDP(18, Decimal.ROUND_CEIL).toString() );

    });

    it('Should send all', async () => {

      await this.humanist.add({
        birthday: Utils.nowInSecond(),
        email: 'email@email.com',
        id: 'id'
      });
      const blockNumber = await this.ethWallet.walletClient.provider.getBlockNumber();

      const ethWallet1 = new EthWallet();
      await ethWallet1.open();

      await this.faucetEthWallet.send(ethWallet1.data.address, '1');

      const humanist1 = new Humanist(ethWallet1, Humanist.getContract(this.contractHumanist.address, ethWallet1) );
      await humanist1.add({
        birthday: Utils.nowInSecond(),
        email: 'email1@email.com',
        id: 'id1'
      });

      const balance1Start = await humanist1.balance();

      const expectValue = Utils.valueDecrease(
        this.initBalance.toString(), blockNumber + 2,
        await this.ethWallet.walletClient.provider.getBlockNumber(),
        this.esperance);

      expect(balance1Start)
        .to.eq(expectValue.toDP(18, Decimal.ROUND_CEIL).toString() );

      const value = expectValue.toDP(18, Decimal.ROUND_CEIL).toString();
      const res = await humanist1.send(this.humanist.ethWallet.data.address, value);
      expect(res).to.be.true;

      const balanceEnd = await this.humanist.balance();

      const expectValueEndInit = Utils.valueDecrease(
        this.initBalance.toString(),
        blockNumber,
        await this.ethWallet.walletClient.provider.getBlockNumber(),
        this.esperance);

      const expectValueEndTransfer = Utils.valueDecrease(
        this.initBalance.toString(),
        blockNumber + 2,
        await this.ethWallet.walletClient.provider.getBlockNumber(),
        this.esperance);

      expect(balanceEnd)
        .to.eq(new Decimal(expectValueEndInit).add(expectValueEndTransfer).toDP(18, Decimal.ROUND_CEIL).toString() );

      const balance1End = await humanist1.balance();
      expect(balance1End)
        .to.eq('0.0');

    });

    it('Should get empty total supply', async () => {

      const totalSupply = await this.humanist.totalSupply();
      expect(totalSupply).to.eq('0.0');

    });

    it('Should get total supply', async () => {

      await this.humanist.add({
        birthday: Utils.nowInSecond(),
        email: 'email@email.com',
        id: 'id'
      });
      const blockNumber = await this.ethWallet.walletClient.provider.getBlockNumber();
      const totalSupply = await this.humanist.totalSupply();

      const expectValueEnd = Utils.valueDecrease(
        '1',
        blockNumber,
        await this.ethWallet.walletClient.provider.getBlockNumber(),
        this.esperance);

      expect(totalSupply)
        .to.eq(expectValueEnd.toDP(18, Decimal.ROUND_CEIL).toString() );


      const ethWallet1 = new EthWallet();
      await ethWallet1.open();

      await this.faucetEthWallet.send(ethWallet1.data.address, '1');

      const humanist1 = new Humanist(ethWallet1, Humanist.getContract(this.contractHumanist.address, ethWallet1) );

      await humanist1.add({
        birthday: Utils.nowInSecond(),
        email: 'email1@email.com',
        id: 'id1',
      });

      const totalSupply2 = await this.humanist.totalSupply();
      const expectValueEnd2 = Utils.valueDecrease(
        '1',
        blockNumber,
        await this.ethWallet.walletClient.provider.getBlockNumber(),
        this.esperance);

      const expectValueEnd22 = Utils.valueDecrease(
        '1',
        blockNumber + 2,
        await this.ethWallet.walletClient.provider.getBlockNumber(),
        this.esperance);

      expect(totalSupply2).to
        .eq(expectValueEnd2.add(expectValueEnd22).toDP(18, Decimal.ROUND_CEIL).toString() );

    });

    describe('With server', () => {

      beforeEach(async () => {

        this.stubSend = this.sandbox.stub(UtilsApi, 'sendMailCode').resolves(true);
        StateWatcher.start();
        await App.start();

      });

      afterEach(() => {

        StateWatcher.stop();
        App.stop();
        Db.clear();

      });

      it('Should remove from db after validation', async () => {

        const birthday = Utils.nowInSecond();

        const resSubmit = await apiClient.submission({
          birthday,
          email: 'email@email.com'
        }, this.humanist.ethWallet.data.address);
        expect(resSubmit).to.be.a.string;

        const resStatus = await apiClient.status(resSubmit);
        expect(resStatus.state).to.eq(InterfaceValidator.STATES().PENDING);

        const code = this.stubSend.args[0][1];
        await apiClient.callbackEmail(code);
        await this.humanist.add({
          birthday,
          email: 'email@email.com',
          id: resSubmit
        });

        await Utils.wait(5000);

        await expect(apiClient.status(resSubmit) ).to.be.rejectedWith(Error, 'Api error');

      });

    });

  });

  describe('Validate human', () => {

    beforeEach( async () => {

      this.oraclizeBridge = new OraclizeBridge();
      const oraclizeAddress = await this.oraclizeBridge.start();
      const urlTunnel = await Tunnel.start();

      this.contractTypes = await ContractUtils.deployContract(this.ethWalletOwner, 'types');
      this.contractStore = await ContractUtils.deployContract(this.ethWalletOwner, 'store', [], [{
        name: 'Types',
        address: this.contractTypes.address
      }]);

      const params = [
        100,
        true,
        this.contractStore.address,
        urlTunnel,
        oraclizeAddress
      ];

      this.contractHumanist = await ContractUtils.deployContract(this.ethWalletOwner, 'humanist', params, [{
        name: 'Types',
        address: this.contractTypes.address
      }] );

      await this.contractStore.setConsumer(this.contractHumanist.address);

      this.ethWallet = new EthWallet();
      await this.ethWallet.open();

      await this.faucetEthWallet.send(this.ethWallet.data.address, '10');
      this.humanist = new Humanist(this.ethWallet,
        Humanist.getContract(this.contractHumanist.address, this.ethWallet) );

      this.configOldContract = config.CONTRACT_ADDRESS;
      config.CONTRACT_ADDRESS = this.contractHumanist.address;

    });

    afterEach( async () => {

      config.CONTRACT_ADDRESS = this.configOldContract;

      this.humanist.close();
      await this.oraclizeBridge.stop();
      await Tunnel.stop();

    });

    it('Cannot create with insufficient fund', async () => {

      await expect(this.humanist.add({
        birthday: Utils.nowInSecond(),
        email: 'email@email.com',
        id: 'id',
        amount: '0'
      }) ).to.be.rejectedWith(Error, 'insufficient_amount');

    });

    it('Should create', async () => {

      const balance = await this.humanist.balance();
      expect(balance).to.eq('1.0' );

      const res = await this.humanist.add({
        birthday: Utils.nowInSecond(),
        email: 'email@email.com',
        id: 'id',
        amount: '0.1'
      });

      expect(res).to.be.true;
      const balanceAfter = await this.humanist.balance();

      const blockNumber = await this.ethWallet.walletClient.provider.getBlockNumber();
      const expectValue = Utils.valueDecrease(
        balance.toString(), blockNumber, blockNumber,
        this.esperance);

      expect(balanceAfter).to.eq(expectValue.toDP(18, Decimal.ROUND_CEIL).toString() );



    });

    it('Should get me', async () => {

      const now = Utils.nowInSecond();
      await this.humanist.add({
        birthday: now,
        email: 'email@email.com',
        id: 'id',
        amount: '0.1'
      });

      const me = await this.humanist.me();

      expect(me.createdAt).to.eq(now.toString() );
      expect(me.birthday).to.eq(now.toString() );
      expect(me.validate).to.be.false;
      expect(me.hash).to.exist;

    });

    it('Cannot send without validate', async () => {

      await this.humanist.add({
        birthday: Utils.nowInSecond(),
        email: 'email@email.com',
        id: 'id',
        amount: '0.1'
      });

      const ethWallet1 = new EthWallet();
      await ethWallet1.open();

      await this.faucetEthWallet.send(ethWallet1.data.address, '1');

      const humanist1 = new Humanist(ethWallet1, Humanist.getContract(this.contractHumanist.address, ethWallet1));
      await humanist1.add({
        birthday: Utils.nowInSecond(),
        email: 'email1@email.com',
        id: 'id1',
        amount: '0.1'
      });

      const res = await humanist1.send(
        this.humanist.ethWallet.data.address,
        '0.01');
      expect(res).to.be.false;

    });

    describe('With server', () => {

      beforeEach(async () => {

        this.stubSend = this.sandbox.stub(UtilsApi, 'sendMailCode').resolves(true);
        await App.start();

      });

      afterEach( () => {

        App.stop();
        Db.clear();

      });

      it('Should get me after validation', async () => {

        const balance = await this.humanist.balance();
        expect(balance).to.eq('1.0' );
        const birthday = Utils.nowInSecond();

        const resSubmit = await apiClient.submission({
          birthday,
          email: 'email@email.com'
        }, this.humanist.ethWallet.data.address);

        expect(resSubmit).to.exist;
        const code = this.stubSend.args[0][1];

        const resCallback = await apiClient.callbackEmail(code);
        expect(resCallback).to.be.true;

        let eventValidateFire = false;
        this.humanist.contract.onvalidatehuman = (address, state) => {

          expect(eventValidateFire).to.be.false;
          eventValidateFire = true;
          expect(address).to.be.a.string;
          expect(state).to.be.true;

        };

        const res = await this.humanist.add({
          birthday: Utils.nowInSecond(),
          email: 'email@email.com',
          id: resSubmit,
          amount: '0.1'
        });

        expect(res).to.be.true;

        await Utils.wait(10000);
        expect(eventValidateFire).to.be.true;

        const account = await this.humanist.me();
        expect(account.validate).to.be.true;

      });

    });

  });

});
