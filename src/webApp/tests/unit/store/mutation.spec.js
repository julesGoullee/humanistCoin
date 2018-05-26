import { createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import { cloneDeep } from 'lodash';

import state from '@/store/state';
import mutations from '@/store/mutations';
import storeHumanist from '@/store/storeHumanist';

describe('Store: mutations', function() {
  beforeEach(() => {
    this.sandbox = createSandbox();
    this.state = cloneDeep(state);
    this.localVue = createLocalVue();
    this.localVue.use(Vuex);
    this.humanist = {
      ethWallet: {
        data: {
          address: 'humanist'
        }
      }
    };
  });

  afterEach(() => {
    storeHumanist.data = {};
    this.sandbox.restore();
  });

  it('Should create wallet', () => {
    mutations.createWallet(this.state, 'ethWallet');
    expect(this.state.ethWallet).to.eq('ethWallet');
  });

  it('Should create humanist', () => {

    mutations.createHumanist(this.state, this.humanist);

    expect(this.state.humanist).to.eq('humanist');
    expect(storeHumanist.data[this.state.humanist]).to.deep.eq(this.humanist);
  });

  it('Should update me', () => {
    mutations.me(this.state, 'me');
    expect(this.state.me).to.eq('me');
  });

  it('Should node connect', () => {
    mutations.nodeConnect(this.state);
    expect(this.state.nodeConnected).to.be.true;
  });

  it('Should create submission', () => {
    mutations.createSubmission(this.state);
    expect(this.state.submission).to.deep.eq({ status: null });
  });

  it('Should submit', () => {
    mutations.createSubmission(this.state);
    mutations.submit(this.state);
    expect(this.state.submission.status).to.eq('submit');
  });

  it('Should submit oracle', () => {
    mutations.createSubmission(this.state);
    mutations.submitOracle(this.state, { id: 'id' });
    expect(this.state.submission.status).to.be.null;
    expect(this.state.submission.id).to.eq('id');
  });

  it('Should validate submission', () => {
    mutations.createSubmission(this.state);
    mutations.validateSubmission(this.state, true);
    expect(this.state.submission.status).to.eq('validate');
  });

  it('Should reject submission', () => {
    mutations.createSubmission(this.state);
    mutations.validateSubmission(this.state);
    expect(this.state.submission.status).to.eq('rejected');
  });

  it('Should reject submission', () => {
    mutations.createSubmission(this.state);
    mutations.validateSubmission(this.state, false);
    expect(this.state.submission.status).to.eq('rejected');
  });
  it('Should update balance', () => {
    mutations.balance(this.state, 'balance');
    expect(this.state.balance).to.eq('balance');
  });
  it('Should add tx', () => {
    mutations.tx(this.state, 'tx');
    expect(this.state.txs.length).to.eq(1);
    expect(this.state.txs[0]).to.eq('tx');
  });
});
