import { createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import { cloneDeep } from 'lodash';

import state from '@/store/state';

describe('Store: state', function () {
  beforeEach(() => {
    this.sandbox = createSandbox();
    this.store = new Vuex.Store({
      state: cloneDeep(state)
    });
    this.localVue = createLocalVue();
    this.localVue.use(Vuex);
  });

  afterEach(() => {
    this.sandbox.restore();
  });

  it('Should get ethWallet', () => {
    expect(this.store.state.ethWallet).to.eq(null);
    expect(this.store.state.humanist).to.eq(null);
    expect(this.store.state.me).to.eq(null);
    expect(this.store.state.txs).to.deep.eq([]);
    expect(this.store.state.submission).to.eq(null);
    expect(this.store.state.nodeConnected).to.eq(false);
  });
});
