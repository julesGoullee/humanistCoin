const path = require('path');

const Web3 = require('web3');
const Decimal = require('decimal.js');
const moment = require('moment');

const Node = require(path.join(srcDir, '../tools/node') );
const OraclizeBridge = require(path.join(srcDir, '../tools/oraclizeBridge') );

const config = require(path.join(srcDir, '/config') );
const EthWallet = require(path.join(srcDir, '/ethWallet') );
const ContractUtils = require(path.join(srcDir, '../tools/contract') );
const Tunnel = require(path.join(srcDir, '../tools/httpTunnel') );
const Humanist = require(path.join(srcDir, '/humanist') );
const Utils = require(path.join(srcDir, '/utils') );
const App = require(path.join(srcDir, '/oracleApi/services/api/app') );
const StatusWatcher = require(path.join(srcDir, '/oracleApi/services/blockchains/statusWatcher') );
const Db = require(path.join(srcDir, '/oracleApi/modules/db') );
const apiClient = require(path.join(srcDir, '/apiClient') );
const InterfaceValidator = require(path.join(srcDir, '/oracleApi/modules/validators/interface') );

describe('Humanist', () => {

  beforeEach( async () => {

    this.sandbox = createSandbox();

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

    await EthWallet.closeNode();
    await this.node.stop();
    this.sandbox.restore();

  });

  it('Should have min amount and exec error', () => {

    expect(Humanist.blockchainExecError).to.exist;
    expect(Humanist.addMinAmount).to.exist;

  });

  describe('Without validation', async () => {

    beforeEach( async () => {

      this.configOldRunVefify = config.RUN.VERIFY;
      config.RUN.VERIFY = false;

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

      this.humanist.close();
      config.RUN.VERIFY = this.configOldRunVefify;
      config.CONTRACT_ADDRESS = this.configOldContract;

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

    it('Should delegate addition', async () => {

      const ethWallet1 = new EthWallet();
      await ethWallet1.open();

      await this.faucetEthWallet.send(ethWallet1.data.address, '1');

      const humanist1 = new Humanist(ethWallet1, Humanist.getContract(this.contractHumanist.address, ethWallet1) );
      const balance = await humanist1.balance();
      expect(balance).to.eq('1.0' );

      const res = await this.humanist.add({
        birthday: Utils.nowInSecond(),
        email: 'email1@email.com',
        id: 'id1',
        address: humanist1.ethWallet.data.address
      });
      expect(res).to.be.true;
      const balanceAfter = await humanist1.balance();

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

    it('Should get exiting human by address', async () => {

      const res = await this.humanist.exist();
      expect(res).to.be.false;

      await this.humanist.add({
        birthday: Utils.nowInSecond(),
        email: 'email@email.com',
        id: 'id'
      });

      const res1 = await this.humanist.exist();
      expect(res1).to.be.true;

    });

    it('Should get other existing human', async () => {

      const ethWallet1 = new EthWallet();
      await ethWallet1.open();

      await this.faucetEthWallet.send(ethWallet1.data.address, '1');

      const humanist1 = new Humanist(ethWallet1, Humanist.getContract(this.contractHumanist.address, ethWallet1) );
      const res = await this.humanist.exist(humanist1.ethWallet.data.address);
      expect(res).to.be.false;

      await humanist1.add({
        birthday: Utils.nowInSecond(),
        email: 'email@email.com',
        id: 'id'
      });

      const res1 = await this.humanist.exist(humanist1.ethWallet.data.address);
      expect(res1).to.be.true;

    });

    describe('event', () => {

      it('Should listen and stop on close', async () => {

        expect(this.humanist.ethWallet).to.exist;
        expect(this.humanist.contract).to.exist;
        expect(this.humanist.listening).to.be.false;
        await this.humanist.listen();
        expect(this.humanist.listening).to.be.true;
        this.humanist.close();
        expect(this.humanist.listening).to.be.false;

      });

      it('Should listen event on validate', async () => {

        let isFire = false;

        this.humanist.on('validate', ({ address, status }) => {

          expect(isFire).to.be.false;

          isFire = true;
          expect(address).to.exist;
          expect(status).to.be.true;

        });

        await this.humanist.listen();
        await this.humanist.add({
          birthday: Utils.nowInSecond(),
          email: 'email@email.com',
          id: 'id'
        });

        await Utils.wait(4000);
        expect(isFire).to.be.true;

      });

      it('Should listen balance', async () => {

        await this.humanist.listen();
        let callCount = 0;

        this.humanist.on('balance', (balance) => {

          callCount += 1;
          expect(balance).to.exist;

        });

        await this.humanist.add({
          birthday: Utils.nowInSecond(),
          email: 'email@email.com',
          id: 'id'
        });

        await Utils.wait(4000);

        await EthWallet.mine();
        await Utils.wait(2000);
        await EthWallet.mine();
        await Utils.wait(2000);

        expect(callCount).to.be.eq(3);

      });

      it('Should watch transaction', async () => {

        await this.humanist.add({
          birthday: Utils.nowInSecond(),
          email: 'email@email.com',
          id: 'id'
        });

        const ethWallet1 = new EthWallet();
        await ethWallet1.open();

        await this.faucetEthWallet.send(ethWallet1.data.address, '1');

        const humanist1 = new Humanist(ethWallet1, Humanist.getContract(this.contractHumanist.address, ethWallet1) );

        await humanist1.add({
          birthday: Utils.nowInSecond(),
          email: 'email1@email.com',
          id: 'id1'
        });

        await this.humanist.listen();
        await humanist1.listen();

        let humanistFire = false;
        let humanist1Fire = false;

        this.humanist.on('tx', (tx) => {

          humanistFire = true;
          expect(tx.transactionHash).to.exist;
          expect(tx.blockHash).to.exist;
          expect(tx.blockNumber).to.exist;
          expect(tx.fee).to.exist;
          expect(tx.from).to.exist;
          expect(tx.to).to.exist;
          expect(tx.amount).to.eq('0.1');
          expect(tx.type).to.eq('in');

        });

        humanist1.on('tx', (tx) => {

          humanist1Fire = true;
          expect(tx.transactionHash).to.exist;
          expect(tx.blockHash).to.exist;
          expect(tx.blockNumber).to.exist;
          expect(tx.fee).to.exist;
          expect(tx.from).to.exist;
          expect(tx.to).to.exist;
          expect(tx.amount).to.eq('0.1');
          expect(tx.type).to.eq('out');

        });

        const res = await humanist1.send(this.humanist.ethWallet.data.address, '0.1');

        expect(res).to.be.true;
        await Utils.wait(5000);

        expect(humanistFire).to.be.true;
        expect(humanist1Fire).to.be.true;
        humanist1.close();

      });

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

    it('Cannot send with invalid address', async () => {

      await this.humanist.add({
        birthday: Utils.nowInSecond(),
        email: 'email@email.com',
        id: 'id'
      });
      await expect(this.humanist.send('address', '0.1') )
        .to.be.rejectedWith(Error, 'invalid_address');

    });

    it('Cannot send with invalid amount', async () => {

      await this.humanist.add({
        birthday: Utils.nowInSecond(),
        email: 'email@email.com',
        id: 'id'
      });
      await expect(this.humanist.send(this.ethWallet.data.address, '0,1') )
        .to.be.rejectedWith(Error, 'invalid_amount');

    });

    it('Cannot send to unknown account', async () => {

      await this.humanist.add({
        birthday: Utils.nowInSecond(),
        email: 'email@email.com',
        id: 'id'
      });
      const ethWallet1 = new EthWallet();
      await ethWallet1.open();

      const humanist1 = new Humanist(ethWallet1, Humanist.getContract(this.contractHumanist.address, ethWallet1) );

      await expect(this.humanist.send(humanist1.ethWallet.data.address, '0.1') )
        .to.be.rejectedWith(Error, 'receiver_unknown');

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

    it('Should get transaction history', async () => {

      await this.humanist.add({
        birthday: Utils.nowInSecond(),
        email: 'email@email.com',
        id: 'id'
      });

      const ethWallet1 = new EthWallet();
      await ethWallet1.open();

      await this.faucetEthWallet.send(ethWallet1.data.address, '1');

      const humanist1 = new Humanist(ethWallet1, Humanist.getContract(this.contractHumanist.address, ethWallet1) );

      await humanist1.add({
        birthday: Utils.nowInSecond(),
        email: 'email1@email.com',
        id: 'id1'
      });

      await humanist1.send(this.humanist.ethWallet.data.address, '0.1');

      await Utils.wait(3000);
      const txsSender = await this.humanist.txHistory();

      expect(txsSender.length).to.eq(1);
      expect(txsSender[0].transactionHash).to.exist;
      expect(txsSender[0].blockHash).to.exist;
      expect(txsSender[0].blockNumber).to.exist;
      expect(txsSender[0].fee).to.exist;
      expect(txsSender[0].from).to.be.eq(humanist1.ethWallet.data.address);
      expect(txsSender[0].to).to.be.eq(this.humanist.ethWallet.data.address);
      expect(txsSender[0].amount).to.eq('0.1');
      expect(txsSender[0].type).to.eq('in');

      const txsReceiver = await humanist1.txHistory();
      expect(txsReceiver.length).to.eq(1);
      expect(txsReceiver[0].transactionHash).to.exist;
      expect(txsReceiver[0].blockHash).to.exist;
      expect(txsReceiver[0].blockNumber).to.exist;
      expect(txsReceiver[0].fee).to.exist;
      expect(txsReceiver[0].from).to.be.eq(humanist1.ethWallet.data.address);
      expect(txsReceiver[0].to).to.be.eq(this.humanist.ethWallet.data.address);
      expect(txsReceiver[0].amount).to.eq('0.1');
      expect(txsReceiver[0].type).to.eq('out');

    });

    it('Should get tx history order', async () => {

      await this.humanist.add({
        birthday: Utils.nowInSecond(),
        email: 'email@email.com',
        id: 'id'
      });

      const ethWallet1 = new EthWallet();
      await ethWallet1.open();

      await this.faucetEthWallet.send(ethWallet1.data.address, '1');

      const humanist1 = new Humanist(ethWallet1, Humanist.getContract(this.contractHumanist.address, ethWallet1) );

      await humanist1.add({
        birthday: Utils.nowInSecond(),
        email: 'email1@email.com',
        id: 'id1'
      });

      await humanist1.send(this.humanist.ethWallet.data.address, '0.1');
      await this.humanist.send(humanist1.ethWallet.data.address, '0.11');

      await Utils.wait(1000);
      const txs1 = await this.humanist.txHistory();
      const txs2 = await humanist1.txHistory();

      expect(txs1.length).to.eq(2);
      expect(txs2.length).to.eq(2);

      expect(txs1[0].transactionHash).to.eq(txs2[0].transactionHash);
      expect(txs1[1].transactionHash).to.eq(txs2[1].transactionHash);

      expect(txs1[0].from).to.eq(humanist1.ethWallet.data.address);
      expect(txs1[0].to).to.eq(this.humanist.ethWallet.data.address);
      expect(txs1[0].type).to.eq('in');
      expect(txs1[1].from).to.eq(this.humanist.ethWallet.data.address);
      expect(txs1[1].to).to.eq(humanist1.ethWallet.data.address);
      expect(txs1[1].type).to.eq('out');

      expect(txs2[0].from).to.eq(humanist1.ethWallet.data.address);
      expect(txs2[0].to).to.eq(this.humanist.ethWallet.data.address);
      expect(txs2[0].type).to.eq('out');
      expect(txs2[1].from).to.eq(this.humanist.ethWallet.data.address);
      expect(txs2[1].to).to.eq(humanist1.ethWallet.data.address);
      expect(txs2[1].type).to.eq('in');

    });

    describe('With server', () => {

      beforeEach(async () => {

        StatusWatcher.start();
        await App.start();

      });

      afterEach(() => {

        StatusWatcher.stop();
        App.stop();
        Db.clear();

      });

      it('Should remove from db after validation', async () => {

        const birthday = moment();

        const resSubmit = await apiClient.submission({
          birthday: birthday.format(),
          email: 'email@email.com'
        }, this.humanist.ethWallet.data.address);
        expect(resSubmit.id).to.be.a.string;
        expect(resSubmit.status).to.eq(InterfaceValidator.STATUS().PENDING);

        await apiClient.callbackEmail('00000000-0000-0000-0000-000000000000');
        await this.humanist.add({
          birthday: birthday.unix(),
          email: 'email@email.com',
          id: resSubmit.id
        });

        await Utils.wait(5000);

        await expect(apiClient.status(resSubmit.id) ).to.be.rejectedWith(Error, 'unknown_id');

      });

    });

  });

  describe('Validate human', () => {

    beforeEach( async () => {

      this.configOldRunVefify = config.RUN.VERIFY;
      config.RUN.VERIFY = true;

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
      config.RUN.VERIFY = this.configOldRunVefify;
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

        await App.start();

      });

      afterEach( () => {

        App.stop();
        Db.clear();

      });

      it('Should get me after validation', async () => {

        const balance = await this.humanist.balance();
        expect(balance).to.eq('1.0' );
        const birthday = moment();

        const resSubmit = await apiClient.submission({
          birthday: birthday.format(),
          email: 'email@email.com'
        }, this.humanist.ethWallet.data.address);

        expect(resSubmit.id).to.be.a.string;

        const resCallback = await apiClient.callbackEmail('00000000-0000-0000-0000-000000000000');
        expect(resCallback.id).to.eq(resSubmit.id);
        expect(resCallback.status).to.eq(InterfaceValidator.STATUS().CONFIRMED);

        let eventValidateFire = false;
        this.humanist.on('validate', ({address, status}) => {

          expect(eventValidateFire).to.be.false;
          eventValidateFire = true;
          expect(address).to.be.exist;
          expect(status).to.be.true;

        });

        await this.humanist.listen();
        const res = await this.humanist.add({
          birthday: birthday.unix(),
          email: 'email@email.com',
          id: resSubmit.id,
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
