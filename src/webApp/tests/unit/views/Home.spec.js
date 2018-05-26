import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';

import Home from '@/views/Home.vue';
import NodeConnect from '@/components/NodeConnect.vue';
import LoadWallet from '@/components/LoadWallet.vue';
import Wallet from '@/components/Wallet.vue';
import Submission from '@/components/Submission.vue';

describe('Views: Home.vue', function() {
  beforeEach(() => {
    this.sandbox = createSandbox();
    this.localVue = createLocalVue();
    this.localVue.use(Vuex);

    this.stubs = {
      actions: {
        nodeConnect: this.sandbox.stub()
      },
      getters: {
        nodeConnected: this.sandbox.stub().returns(false),
        humanist: this.sandbox.stub().returns(false),
        me: this.sandbox.stub().returns(null),
        submission: this.sandbox.stub().returns(null)
      }
    };
    this.store = new Vuex.Store({
      actions: {
        nodeConnect: this.stubs.actions.nodeConnect
      },
      getters: {
        nodeConnected: this.stubs.getters.nodeConnected,
        humanist: this.stubs.getters.humanist,
        me: this.stubs.getters.me,
        submission: this.stubs.getters.submission
      }
    });

    this.shallowConfig = { store: this.store, localVue: this.localVue };
  });

  afterEach(() => {
    this.sandbox.restore();
  });

  it('Should render node connection', () => {
    this.stubs.getters.nodeConnected.returns(false);
    this.stubs.getters.me.returns(false);
    const wrapper = shallowMount(Home, this.shallowConfig);
    expect(wrapper.contains(NodeConnect)).to.be.true;
  });

  it('Should render load wallet when node connected', () => {
    this.stubs.getters.nodeConnected.returns(true);
    this.stubs.getters.humanist.returns(false);
    this.stubs.getters.me.returns(false);
    const wrapper = shallowMount(Home, this.shallowConfig);
    expect(wrapper.contains(LoadWallet)).to.be.true;
  });

  it('Should render wallet when load and validate', () => {
    this.stubs.getters.nodeConnected.returns(true);
    this.stubs.getters.humanist.returns(true);
    this.stubs.getters.me.returns({
      validate: true
    });
    const wrapper = shallowMount(Home, this.shallowConfig);
    expect(wrapper.contains(Wallet)).to.be.true;
  });

  it('Should render submission when load wallet', () => {
    this.stubs.getters.nodeConnected.returns(true);
    this.stubs.getters.humanist.returns(true);
    this.stubs.getters.me.returns(null);
    this.stubs.getters.submission.returns(true);
    const wrapper = shallowMount(Home, this.shallowConfig);
    expect(wrapper.contains(Submission)).to.be.true;
  });
});
