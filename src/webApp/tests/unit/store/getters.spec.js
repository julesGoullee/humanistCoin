import { createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import { cloneDeep } from 'lodash';

import state from '@/store/state';
import getters from '@/store/getters';
import storeHumanist from '@/store/storeHumanist';

describe('Store: getters', function() {
  beforeEach(() => {
    this.sandbox = createSandbox();
    this.localVue = createLocalVue();
    this.localVue.use(Vuex);
    this.store = new Vuex.Store({
      state: cloneDeep(state),
      getters: cloneDeep(getters)
    });
  });

  afterEach(() => {
    storeHumanist.data = {};
    this.sandbox.restore();
  });

  it('Should get ethWallet', () => {
    expect(this.store.getters.ethWallet).to.eq(null);
    this.store.state.ethWallet = 'ethWallet';
    expect(this.store.getters.ethWallet).to.eq('ethWallet');
  });

  it('Should get submission', () => {
    expect(this.store.getters.submission).to.eq(null);
    this.store.state.submission = 'submission';
    expect(this.store.getters.submission).to.eq('submission');
  });

  it('Should get me', () => {
    expect(this.store.getters.me).to.eq(null);
    this.store.state.me = 'me';
    expect(this.store.getters.me).to.eq('me');
  });

  it('Should get txs', () => {
    expect(this.store.getters.txs).to.deep.eq([]);
    this.store.state.txs = ['tx1', 'tx2'];
    expect(this.store.getters.txs).to.deep.eq(['tx1', 'tx2']);
  });
  it('Should get balance', () => {
    expect(this.store.getters.balance).to.eq(null);
    this.store.state.balance = 'balance';
    expect(this.store.getters.balance).to.eq('balance');
  });

  it('Should get humanist', () => {
    expect(this.store.getters.humanist).to.eq(null);
    this.store.state.humanist = 'humanist';
    storeHumanist.data.humanist = 'humanist';
    expect(this.store.getters.humanist).to.eq('humanist');
  });

  it('Cannot get if not found is store', () => {
    this.store.state.humanist = 'humanist';
    expect(this.store.getters.humanist).to.eq(null);
  });

  it('Should get nodeConnected', () => {
    expect(this.store.getters.nodeConnected).to.false;
    this.store.state.nodeConnected = true;
    expect(this.store.getters.nodeConnected).to.be.true;
  });
});
