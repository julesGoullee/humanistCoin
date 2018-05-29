import { createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import { cloneDeep } from 'lodash';

import actions from '@/store/actions';
import state from '@/store/state';
import EthWallet from '@/../../ethWallet';
import Humanist from '@/../../humanist';
import ApiClient from '@/../../apiClient';
import config from '@/../../config';
import storeHumanist from '@/store/storeHumanist';
const moment = require('moment');

describe('Store: actions', function() {
  before(() => {
    this.oldContractAddress = config.CONTRACT_ADDRESS;
    this.oldENV = config.ENV;
    this.oldEthInitialize = EthWallet.initialize;
    EthWallet.initialize = true;
  });

  after(() => {
    EthWallet.initialize = this.oldEthInitialize;
    config.CONTRACT_ADDRESS = this.oldContractAddress;
    config.ENV = this.oldENV;
  });

  beforeEach(() => {
    this.sandbox = createSandbox();
    this.state = cloneDeep(state);
    this.stubCommit = this.sandbox.stub();
    this.stubDispatch = this.sandbox.stub();
    this.localVue = createLocalVue();
    this.localVue.use(Vuex);
    this.actionArgs = {
      state: this.state,
      commit: this.stubCommit,
      dispatch: this.stubDispatch
    };
    this.stubInitNode = this.sandbox.stub(EthWallet, 'initNode');
    this.stubApiInfo = this.sandbox.stub(ApiClient, 'info');
    this.stubOpenEthWallet = this.sandbox.stub(EthWallet.prototype, 'open');
    this.stubGetContractHumanist = this.sandbox.stub(Humanist, 'getContract');
  });

  afterEach(() => {
    storeHumanist.data = {};
    this.sandbox.restore();
  });

  describe('nodeConnect', () => {
    it('Cannot connect to node if already connected', async () => {
      this.state.nodeConnected = true;
      await expect(actions.nodeConnect(this.actionArgs)).to.be.rejectedWith(Error, 'node_already_connected');
    });

    it('Should init node without fetch address', async () => {
      config.FETCH_API_CONTRACT = false;

      await actions.nodeConnect(this.actionArgs);

      expect(this.stubInitNode.calledOnce).to.be.true;
      expect(this.stubApiInfo.callCount).to.eq(0);
      expect(this.stubCommit.calledWith('nodeConnect')).to.be.true;
    });

    it('Should init node with fetch address', async () => {
      config.FETCH_API_CONTRACT = true;

      this.stubApiInfo.resolves({ contractAddress: 'contractAddress' });

      await actions.nodeConnect(this.actionArgs);

      expect(this.stubInitNode.calledOnce).to.be.true;
      expect(this.stubApiInfo.calledOnce).to.be.true;
      expect(this.stubCommit.calledWith('nodeConnect')).to.be.true;
      expect(config.CONTRACT_ADDRESS).to.eq('contractAddress');
      config.FETCH_API_CONTRACT = false;
    });
  });

  describe('createWallet', () => {
    it('Cannot create wallet if ethWallet already exist', async () => {
      this.state.ethWallet = 'ethWallet';

      await expect(actions.createWallet(this.actionArgs, { privateKey: 'privateKey' }))
        .to.be.rejectedWith(Error, 'wallet_eth_already_exist');
    });

    it('Cannot create wallet if humanist already exist', async () => {
      this.state.humanist = 'humanist';
      storeHumanist.data.humanist = 'humanist';
      await expect(actions.createWallet(this.actionArgs, { privateKey: 'privateKey' }))
        .to.be.rejectedWith(Error, 'humanist_already_exist');
    });

    it('Should create wallet', async () => {
      await actions.createWallet(this.actionArgs, { privateKey: 'privateKey' });

      expect(this.stubOpenEthWallet.calledOnce).to.be.true;
      expect(this.stubCommit.args[0][0]).to.be.eq('createWallet');
      expect(this.stubCommit.args[0][1].ethWallet).to.be.an.instanceOf(EthWallet);
      expect(this.stubDispatch.calledWith('createHumanist')).to.be.true;
    });
  });

  describe('Submit', () => {
    beforeEach(() => {
      this.now = moment();
      this.params = {
        email: 'email',
        birthday: this.now
      };
    });

    it('Cannot submit if submission already exist', async () => {
      this.state.submission = { status: 'submit' };

      await expect(actions.submit(this.actionArgs, this.params))
        .to.be.rejectedWith(Error, 'humanist_already_validate');
    });

    it('Cannot submit if me already validate', async () => {
      this.state.submission = { status: null };
      this.state.me = { validate: true };

      await expect(actions.submit(this.actionArgs, this.params))
        .to.be.rejectedWith(Error, 'humanist_already_validate');
    });

    it('Cannot submit without human', async () => {
      this.state.submission = { status: null };
      this.state.humanist = null;

      await expect(actions.submit(this.actionArgs, this.params))
        .to.be.rejectedWith(Error, 'unknown_humanist');
    });

    describe('With verification', () => {
      beforeEach(() => {
        this.oldConfigVerify = config.RUN.VERIFY;
        config.RUN.VERIFY = false;
      });

      afterEach(() => {
        config.RUN.VERIFY = this.oldConfigVerify;
      });

      it('Should submit without verification', async () => {
        this.state.submission = { status: null };
        this.state.humanist = 'humanist';
        storeHumanist.data.humanist = {};

        await actions.submit(this.actionArgs, this.params);

        expect(this.stubCommit.args[0][0]).to.be.eq('submit');
        expect(this.stubDispatch.args[0][0]).to.be.eq('submitBC');
      });

    });

    describe('With verification', () => {
      beforeEach(() => {
        this.oldConfigVerify = config.RUN.VERIFY;
        config.RUN.VERIFY = true;
      });

      afterEach(() => {
        config.RUN.VERIFY = this.oldConfigVerify;
      });

      it('Should submit with verification', async () => {
        this.state.submission = { status: null };
        this.state.humanist = 'humanist';
        storeHumanist.data.humanist = {};

        await actions.submit(this.actionArgs, this.params);

        expect(this.stubCommit.args[0][0]).to.be.eq('submit');
        expect(this.stubDispatch.args[0][0]).to.be.eq('submitOracle');
        expect(this.stubDispatch.args[0][1]).to.be.deep.eq({
          email: 'email',
          birthday: this.now
        });

      });

    });

  });

  describe('Submit oracle', () => {

    beforeEach(() => {
      this.now = moment();
      this.params = {
        email: 'email',
        birthday: this.now
      };
      this.stubApiClientSubmission = this.sandbox.stub(ApiClient, 'submission');

    });

    it('Cannot submit oracle if submission already validate', async () => {
      this.state.submission = { status: 'validate' };

      await expect(actions.submitOracle(this.actionArgs, this.params))
        .to.be.rejectedWith(Error, 'existing_submission');
    });

    it('Cannot submit oracle if me already validate', async () => {
      this.state.submission = { status: 'submit' };
      this.state.me = { validate: true };

      await expect(actions.submitOracle(this.actionArgs, this.params))
        .to.be.rejectedWith(Error, 'humanist_already_validate');
    });

    it('Cannot submit oracle without human', async () => {
      this.state.submission = { status: 'submit' };
      this.state.humanist = null;

      await expect(actions.submitOracle(this.actionArgs, this.params))
        .to.be.rejectedWith(Error, 'unknown_humanist');
    });

    it('Should submit oracle', async () => {
      this.state.submission = { status: 'submit' };
      this.state.humanist = 'humanist';
      storeHumanist.data.humanist = {
        ethWallet: {
          data: {
            address: 'address'
          }
        }
      };
      this.stubApiClientSubmission.resolves({ id: 'id' });

      await actions.submitOracle(this.actionArgs, this.params);
      expect(this.stubApiClientSubmission.args[0][0]).to.be.deep.eq({
        email: 'email',
        birthday: this.now.format()
      });
      expect(this.stubApiClientSubmission.args[0][1]).to.eq('address');
      expect(this.stubCommit.args[0][0]).to.eq('submitOracle');
      expect(this.stubCommit.args[0][1].submission).to.deep.eq({
        id: 'id',
        email: 'email',
        birthday: this.now.format()
      });
    });

    it('Should create submission and throw on api error', async () => {
      this.state.submission = { status: 'submit' };
      this.state.humanist = 'humanist';
      storeHumanist.data.humanist = {
        ethWallet: {
          data: {
            address: 'address'
          }
        }
      };
      this.stubApiClientSubmission.rejects(Error('api error'));
      await expect(actions.submitOracle(this.actionArgs, this.params) ).to.be.rejectedWith(Error, 'api error');
      expect(this.stubCommit.calledOnce).to.be.true;
      expect(this.stubCommit.args[0][0]).to.eq('createSubmission');

    });

  });

  describe('Submit code', () => {

    beforeEach(() => {
      this.params = { code: 'code' };
      this.now = moment();
      this.stubApiClientCallbackEmail = this.sandbox.stub(ApiClient, 'callbackEmail');
    });

    it('Cannot submit code if status is not PENDING', async () => {
      this.state.submission = { status: 'validate' };

      await expect(actions.submitCode(this.actionArgs, this.params))
        .to.be.rejectedWith(Error, 'unknown_submission');
    });

    it('Cannot submit code if me already validate', async () => {
      this.state.submission = { status: 'PENDING' };
      this.state.me = { validate: true };

      await expect(actions.submitCode(this.actionArgs, this.params))
        .to.be.rejectedWith(Error, 'humanist_already_validate');
    });

    it('Cannot submit code without human', async () => {
      this.state.submission = { status: 'PENDING' };
      this.state.humanist = null;

      await expect(actions.submitCode(this.actionArgs, this.params))
        .to.be.rejectedWith(Error, 'unknown_humanist');
    });

    it('Should submit code with confirmed', async () => {
      this.state.submission = { status: 'PENDING' };
      this.state.humanist = 'humanist';
      storeHumanist.data.humanist = {};
      const stubSubmission = {
        status: 'CONFIRMED',
        email: 'email',
        birthday: this.now.format(),
        id: 'id'
      };
      this.stubApiClientCallbackEmail.resolves(stubSubmission);
      await actions.submitCode(this.actionArgs, this.params);

      expect(this.stubCommit.args[0][0]).to.eq('submitOracle');
      expect(this.stubCommit.args[0][1].submission).to.deep.eq(stubSubmission);

      expect(this.stubDispatch.args[0][0]).to.eq('submitBC');

    });

    it('Should submit code with rejected', async () => {
      this.state.submission = { status: 'PENDING' };
      this.state.humanist = 'humanist';
      storeHumanist.data.humanist = {};
      const stubSubmission = {
        status: 'REJECTED',
        email: 'email',
        birthday: this.now.format(),
        id: 'id'
      };
      this.stubApiClientCallbackEmail.resolves(stubSubmission);
      await expect(actions.submitCode(this.actionArgs, this.params) )
        .to.be.rejectedWith(Error, 'invalid_submission_status');

      expect(this.stubCommit.args[0][0]).to.eq('submitOracle');
      expect(this.stubCommit.args[0][1].submission).to.deep.eq(stubSubmission);

      expect(this.stubCommit.args[1][0]).to.eq('createSubmission');
    });

  });

  describe('Submit blockchain', () => {

    beforeEach(() => {
      this.stubAddHumanist = this.sandbox.stub();
      this.stubListenHumanist = this.sandbox.stub();
      this.now = moment();
    });

    it('Cannot submit bc if submission have not status confirmed', async () => {
      this.state.submission = { status: 'validate' };

      await expect(actions.submitBC(this.actionArgs))
        .to.be.rejectedWith(Error, 'invalid_submission');
    });

    it('Cannot submit bc if me already validate', async () => {
      this.state.submission = { status: 'CONFIRMED' };
      this.state.me = { validate: true };

      await expect(actions.submitBC(this.actionArgs))
        .to.be.rejectedWith(Error, 'humanist_already_validate');
    });

    it('Cannot submit bc without human', async () => {
      this.state.submission = { status: 'CONFIRMED' };
      this.state.humanist = null;

      await expect(actions.submitBC(this.actionArgs))
        .to.be.rejectedWith(Error, 'unknown_humanist');
    });

    it('Cannot submit bc if human already exist', async () => {
      this.state.submission = {
        status: 'CONFIRMED',
        email: 'email',
        id: 'id',
        birthday: this.now.format()
      };
      this.state.humanist = 'humanist';
      storeHumanist.data.humanist = {
        add: this.stubAddHumanist,
        listen: this.stubListenHumanist
      };
      this.stubAddHumanist.resolves(false);
      await expect(actions.submitBC(this.actionArgs))
        .to.be.rejectedWith(Error, 'humanist_already_exist');
      expect(this.stubAddHumanist.calledOnce).to.be.true;
      expect(this.stubAddHumanist.args[0][0].birthday).to.be.eq(this.now.unix());
      expect(this.stubAddHumanist.args[0][0].email).to.be.eq('email');
      expect(this.stubAddHumanist.args[0][0].id).to.be.eq('id');
      expect(this.stubListenHumanist.calledOnce).to.be.true;
      expect(this.stubCommit.calledOnce).to.be.true;
      expect(this.stubCommit.args[0][0]).to.be.eq('createSubmission');

    });
    describe('Without verification', () => {
      beforeEach(() => {
        this.oldConfigVerify = config.RUN.VERIFY;
        config.RUN.VERIFY = false;
      });

      afterEach(() => {
        config.RUN.VERIFY = this.oldConfigVerify;
      });

      it('Should submit bc without verification', async () => {
        this.state.submission = {
          status: 'CONFIRMED',
          email: 'email',
          id: 'id',
          birthday: this.now.format()
        };
        this.state.humanist = 'humanist';
        storeHumanist.data.humanist = {
          add: this.stubAddHumanist,
          listen: this.stubListenHumanist
        };
        this.state.me = { validate: false };
        this.stubAddHumanist.resolves(true);

        await actions.submitBC(this.actionArgs);

        expect(this.stubAddHumanist.calledOnce).to.be.true;
        expect(this.stubListenHumanist.calledOnce).to.be.true;
        expect(this.stubAddHumanist.args[0][0].birthday).to.be.eq(this.now.unix());
        expect(this.stubAddHumanist.args[0][0].email).to.be.eq('email');
        expect(this.stubAddHumanist.args[0][0].id).to.be.eq('id');

        expect(this.stubCommit.calledOnce).to.be.true;
        expect(this.stubCommit.args[0][0]).to.be.eq('validateSubmission');
        expect(this.stubCommit.args[0][1].status).to.be.true;
        expect(this.stubDispatch.args[0][0]).to.be.eq('me');
      });

    });

    describe('With verification', () => {
      beforeEach(() => {
        this.oldConfigVerify = config.RUN.VERIFY;
        config.RUN.VERIFY = true;
      });

      afterEach(() => {
        config.RUN.VERIFY = this.oldConfigVerify;
      });

      it('Should submit with verification', async () => {
        this.state.submission = {
          status: 'CONFIRMED',
          email: 'email',
          id: 'id',
          birthday: this.now.format()
        };
        this.state.humanist = 'humanist';
        storeHumanist.data.humanist = {
          add: this.stubAddHumanist,
          listen: this.stubListenHumanist
        };
        this.state.me = { validate: false };
        this.stubAddHumanist.resolves(true);

        await actions.submitBC(this.actionArgs);

        expect(this.stubAddHumanist.calledOnce).to.be.true;
        expect(this.stubListenHumanist.calledOnce).to.be.true;
        expect(this.stubAddHumanist.args[0][0].birthday).to.be.eq(this.now.unix());
        expect(this.stubAddHumanist.args[0][0].email).to.be.eq('email');
        expect(this.stubAddHumanist.args[0][0].id).to.be.eq('id');

        expect(this.stubCommit.calledOnce).to.be.false;
        expect(this.stubDispatch.calledOnce).to.be.true;
        expect(this.stubDispatch.args[0][0]).to.be.eq('watchValidation');
      });
    });

  });

  describe('Validate submission', () => {
    it('Cannot validateSubmission without humanist', async () => {
      this.state.submission = { status: null };
      this.state.humanist = null;

      await expect(actions.validateSubmission(this.actionArgs))
        .to.be.rejectedWith(Error, 'unknown_humanist');
    });

    it('Cannot validateSubmission if me validate', async () => {
      this.state.submission = { status: null };
      this.state.humanist = 'humanist';
      storeHumanist.data.humanist = {};
      this.state.me = { validate: true };

      await expect(actions.validateSubmission(this.actionArgs))
        .to.be.rejectedWith(Error, 'humanist_already_validate');
    });

    it('Should validate submission', async () => {
      this.state.humanist = 'humanist';
      storeHumanist.data.humanist = {};

      await actions.validateSubmission(this.actionArgs, { status: true });

      expect(this.stubCommit.calledOnce).to.be.true;
      expect(this.stubCommit.args[0][0]).to.be.eq('validateSubmission');
      expect(this.stubCommit.args[0][1].status).to.be.true;
      expect(this.stubDispatch.calledOnce).to.be.true;
      expect(this.stubDispatch.args[0][0]).to.be.eq('me');
    });

    it('Should reject validate submission', async () => {
      this.state.humanist = 'humanist';
      storeHumanist.data.humanist = {};

      await actions.validateSubmission(this.actionArgs, { status: false });

      expect(this.stubCommit.calledOnce).to.be.true;
      expect(this.stubCommit.args[0][0]).to.be.eq('validateSubmission');
      expect(this.stubCommit.args[0][1].status).to.be.false;
      expect(this.stubDispatch.callCount).to.be.eq(0);
    });
  });

  describe('Watch validation', () => {
    beforeEach(() => {
      this.stubOnHumanist = this.sandbox.stub();
    });

    it('Cannot watch without human', () => {
      this.state.submission = { status: null };
      this.state.humanist = null;

      expect(() => actions.watchValidation(this.actionArgs)).to.throw('unknown_humanist');
    });

    it('Cannot watch if me validate', () => {
      this.state.humanist = 'humanist';
      storeHumanist.data.humanist = {};
      this.state.submission = { status: null };
      this.state.me = { validate: true };

      expect(() => actions.watchValidation(this.actionArgs)).to.throw('humanist_already_validate');
    });

    it('Should watch validation', async () => {
      this.state.humanist = 'humanist';
      this.state.submission = { status: null };
      storeHumanist.data.humanist = { on: this.stubOnHumanist };
      this.state.me = null;

      await actions.watchValidation(this.actionArgs);

      expect(this.stubOnHumanist.args[0][0]).to.be.eq('validate');
    });

    it('Should fire watch validation', async () => {
      this.state.humanist = 'humanist';
      this.state.submission = { status: null };
      storeHumanist.data.humanist = { on: this.stubOnHumanist };
      this.state.me = null;

      await actions.watchValidation(this.actionArgs);

      this.stubOnHumanist.args[0][1]({ status: true});
      expect(this.stubDispatch.args[0][0]).to.be.eq('validateSubmission');
      expect(this.stubDispatch.args[0][1].status).to.be.true;
    });
  });

  describe('createHumanist', () => {
    it('Cannot create humanist without ethWallet', async () => {
      await expect(actions.createHumanist(this.actionArgs))
        .to.be.rejectedWith(Error, 'unknown_wallet_eth');
    });

    it('Cannot create humanist if humanist already exist', async () => {
      this.state.ethWallet = 'ethWallet';
      this.state.humanist = 'humanist';
      storeHumanist.data.humanist = 'humanist';
      await expect(actions.createHumanist(this.actionArgs))
        .to.be.rejectedWith(Error, 'humanist_already_exist');
    });

    it('Should create humanist', async () => {
      this.state.ethWallet = {
        opened: true,
        constructor: {
          web3: { eth: { Contract: this.sandbox.stub() } },
          web3Ws: { eth: { Contract: this.sandbox.stub() } }
        }
      };
      this.stubGetContractHumanist.returns({
        interface: { abi: this.sandbox.stub() }
      });
      await actions.createHumanist(this.actionArgs);

      expect(this.stubCommit.args[0][0]).to.be.eq('createHumanist');
      expect(this.stubCommit.args[0][1].humanist).to.instanceOf(Humanist);
      expect(this.stubGetContractHumanist.calledOnce).to.be.true;
      expect(this.stubDispatch.args[0][0]).to.be.eq('me');
    });
  });

  describe('me', () => {
    beforeEach(() => {
      this.stubMeHumanist = this.sandbox.stub();
      this.stubListenHumanist = this.sandbox.stub();
      this.state.humanist = 'humanist';
      storeHumanist.data.humanist = {
        me: this.stubMeHumanist,
        listen: this.stubListenHumanist
      };
    });

    it('Cannot me without human', async () => {
      this.state.humanist = null;

      await expect(actions.me(this.actionArgs)).to.be.rejectedWith(Error, 'unknown_humanist');
    });

    it('Should get me with existing', async () => {
      const mockMe = { validate: true };
      this.stubMeHumanist.resolves(mockMe);
      await actions.me(this.actionArgs);

      expect(this.stubCommit.args[0][0]).to.be.eq('me');
      expect(this.stubCommit.args[0][1].me).to.deep.eq(mockMe);
      expect(this.stubListenHumanist.calledOnce).to.be.true;
      expect(this.stubDispatch.args[0][0]).to.be.eq('balance');
      expect(this.stubDispatch.args[1][0]).to.be.eq('txHistory');
      expect(this.stubDispatch.args[2][0]).to.be.eq('watchTx');
      expect(this.stubDispatch.args[3][0]).to.be.eq('watchBalance');
    });

    it('Should get me without validated', async () => {
      const mockMe = { validate: false };
      this.stubMeHumanist.resolves(mockMe);
      await actions.me(this.actionArgs);

      expect(this.stubListenHumanist.calledOnce).to.be.false;
      expect(this.stubCommit.args[0][0]).to.be.eq('createSubmission');
    });

    it('Should get me without anything', async () => {
      this.stubMeHumanist.resolves(null);
      await actions.me(this.actionArgs);

      expect(this.stubListenHumanist.calledOnce).to.be.false;
      expect(this.stubCommit.args[0][0]).to.be.eq('createSubmission');
    });

    it('Cannot get with submission validate throw', async () => {
      this.state.submission = { status: 'validate' };

      this.stubMeHumanist.resolves(null);
      await expect(actions.me(this.actionArgs)).to.be.rejectedWith(Error, 'tx_failed_humanist_already_exist_or_unknown');
      expect(this.stubCommit.args[0][0]).to.be.eq('createSubmission');
    });
  });

  describe('send', () => {
    beforeEach(() => {
      this.stubSendHumanist = this.sandbox.stub();
      this.args = {
        address: 'address',
        amount: 'amount'
      };
    });

    it('Cannot send without humanist', async () => {
      this.state.humanist = null;

      await expect(actions.send(this.actionArgs, this.args))
        .to.be.rejectedWith(Error, 'unknown_humanist');
    });

    it('Cannot send if me not validate', async () => {
      this.state.humanist = 'humanist';
      storeHumanist.data.humanist = {
        send: this.stubSendHumanist
      };
      await expect(actions.send(this.actionArgs, this.args))
        .to.be.rejectedWith(Error, 'humanist_not_validate');
    });

    it('Should send', async () => {
      this.state.humanist = 'humanist';
      storeHumanist.data.humanist = {
        send: this.stubSendHumanist
      };
      this.state.me = { validate: true };
      this.stubSendHumanist.resolves(true);
      await actions.send(this.actionArgs, this.args);

      expect(this.stubSendHumanist.calledOnce).to.be.true;
      expect(this.stubSendHumanist.args[0][0]).to.be.eq('address');
      expect(this.stubSendHumanist.args[0][1]).to.be.eq('amount');
    });

    it('Should throw if send fail', async () => {
      this.state.humanist = 'humanist';
      storeHumanist.data.humanist = {
        send: this.stubSendHumanist
      };
      this.state.me = { validate: true };

      this.stubSendHumanist.resolves(false);
      await expect(actions.send(this.actionArgs, this.args))
        .to.be.rejectedWith(Error, 'send_fail');
    });
  });

  describe('balance', () => {
    beforeEach(() => {
      this.stubBalanceHumanist = this.sandbox.stub();
    });

    it('Cannot update balance without humanist', async () => {
      this.state.humanist = null;

      await expect(actions.balance(this.actionArgs))
        .to.be.rejectedWith(Error, 'unknown_humanist');
    });

    it('Cannot update balance if me not validate', async () => {
      this.state.humanist = 'humanist';
      storeHumanist.data.humanist = {};

      await expect(actions.balance(this.actionArgs))
        .to.be.rejectedWith(Error, 'humanist_not_validate');
    });

    it('Should update balance', async () => {
      this.state.humanist = 'humanist';
      storeHumanist.data.humanist = {
        balance: this.stubBalanceHumanist
      };
      this.state.me = { validate: true };

      this.stubBalanceHumanist.resolves('0.1');
      await actions.balance(this.actionArgs);

      expect(this.stubBalanceHumanist.calledOnce).to.be.true;
      expect(this.stubCommit.calledOnce).to.be.true;
      expect(this.stubCommit.args[0][0]).to.be.eq('balance');
      expect(this.stubCommit.args[0][1].balance).to.be.eq('0.1');
    });
  });

  describe('Watch balance', () => {
    beforeEach(() => {
      this.stubOnHumanist = this.sandbox.stub();
    });

    it('Cannot update balance without humanist', () => {
      this.state.humanist = null;

      expect(() => actions.watchBalance(this.actionArgs))
        .to.throw('unknown_humanist');
    });

    it('Cannot update balance if me not validate', () => {
      this.state.humanist = 'humanist';
      storeHumanist.data.humanist = {};

      expect(() => actions.watchBalance(this.actionArgs))
        .to.throw('humanist_not_validate');
    });

    it('Should update balance', () => {
      this.state.humanist = 'humanist';
      storeHumanist.data.humanist = { on: this.stubOnHumanist };
      this.state.me = { validate: true };

      actions.watchBalance(this.actionArgs);

      expect(this.stubOnHumanist.calledOnce).to.be.true;
      expect(this.stubOnHumanist.args[0][0]).to.be.eq('balance');
      this.stubOnHumanist.args[0][1]('0.1');
      expect(this.stubCommit.calledOnce).to.be.true;
      expect(this.stubCommit.args[0][0]).to.be.eq('balance');
      expect(this.stubCommit.args[0][1].balance).to.be.eq('0.1');
    });
  });

  describe('tx history', () => {
    beforeEach(() => {
      this.stubTxHistoryHumanist = this.sandbox.stub();
    });

    it('Cannot get tx history without humanist', async () => {
      this.state.humanist = null;

      await expect(actions.txHistory(this.actionArgs))
        .to.be.rejectedWith(Error, 'unknown_humanist');
    });

    it('Cannot get tx history if me not validate', async () => {
      this.state.humanist = 'humanist';
      storeHumanist.data.humanist = {};

      await expect(actions.txHistory(this.actionArgs))
        .to.be.rejectedWith(Error, 'humanist_not_validate');
    });

    it('Should get tx history', async () => {
      this.state.humanist = 'humanist';
      storeHumanist.data.humanist = {
        txHistory: this.stubTxHistoryHumanist
      };
      this.state.me = {validate: true};
      this.stubTxHistoryHumanist.resolves([
        { amount: '0.1'},
        { amount: '0.2'}
      ]);
      await actions.txHistory(this.actionArgs);
      expect(this.stubCommit.callCount).to.eq(2);
      expect(this.stubCommit.args[0][0]).to.eq('tx');
      expect(this.stubCommit.args[0][1].tx.amount).to.eq('0.1');
      expect(this.stubCommit.args[1][1].tx.amount).to.eq('0.2');
    });
  });

  describe('Watch tx', () => {
    beforeEach(() => {
      this.stubOnHumanist = this.sandbox.stub();
    });

    it('Cannot watch tx history without humanist', () => {
      this.state.humanist = null;

      expect(() => actions.watchTx(this.actionArgs))
        .to.throw('unknown_humanist');
    });

    it('Cannot watch tx if me not validate', () => {
      this.state.humanist = 'humanist';
      storeHumanist.data.humanist = {};

      expect(() => actions.watchTx(this.actionArgs))
        .to.throw('humanist_not_validate');
    });

    it('Should watch tx history', () => {
      this.state.humanist = 'humanist';
      storeHumanist.data.humanist = { on: this.stubOnHumanist };
      this.state.me = {validate: true};
      actions.watchTx(this.actionArgs);
      expect(this.stubOnHumanist.calledOnce).to.be.true;
      expect(this.stubOnHumanist.args[0][0]).to.be.eq('tx');
      this.stubOnHumanist.args[0][1]({ amount: '0.1'});
      expect(this.stubCommit.calledOnce).to.be.true;
      expect(this.stubCommit.args[0][0]).to.be.eq('tx');
      expect(this.stubCommit.args[0][1].tx.amount).to.be.eq('0.1');
    });
  });
});
