import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';

import NodeConnect from '@/components/NodeConnect.vue';
import { waitNextTick } from '@/../tests/unit/test.utils';
import { createCustom } from '@/../../utils/errors';

describe('Components: NodeConnect', function() {
  beforeEach(() => {
    this.sandbox = createSandbox();
    this.localVue = createLocalVue();
    this.localVue.use(Vuex);

    this.stubs = {
      actions: {
        nodeConnect: this.sandbox.stub()
      },
      getters: {
        nodeConnected: this.sandbox.stub()
      }
    };
    this.store = new Vuex.Store({
      actions: {
        nodeConnect: this.stubs.actions.nodeConnect
      },
      getters: {
        nodeConnected: this.stubs.getters.nodeConnected
      }
    });

    const data = {};

    this.data = data;
    this.shallowConfig = {
      data() { return data; },
      store: this.store,
      localVue: this.localVue
    };
  });

  afterEach(() => {
    this.sandbox.restore();
  });

  it('Should render node not connected', () => {
    this.stubs.getters.nodeConnected.returns(false);
    const wrapper = shallowMount(NodeConnect, this.shallowConfig);
    expect(this.stubs.actions.nodeConnect.calledOnce).to.be.true;
    expect(wrapper.text()).to.include('Connect to node....');
  });

  it('Should render node already connected', () => {
    this.stubs.getters.nodeConnected.returns(true);
    const wrapper = shallowMount(NodeConnect, this.shallowConfig);
    expect(this.stubs.actions.nodeConnect.calledOnce).to.be.false;
    expect(wrapper.text()).to.include('Node connected!');
  });

  it('Should render node connection error', () => {
    this.data.errorConnection = 'Node connection error';
    const wrapper = shallowMount(NodeConnect, this.shallowConfig);
    expect(this.stubs.actions.nodeConnect.callCount).to.eq(0);
    expect(wrapper.text()).to.include('Node connection error');
  });

  it('Should render node connection error when connecting failed', async () => {
    const error = createCustom('node_connection_error', {}, true);
    this.stubs.actions.nodeConnect.rejects(error);
    const wrapper = shallowMount(NodeConnect, this.shallowConfig);

    await waitNextTick(wrapper);
    expect(this.stubs.actions.nodeConnect.callCount).to.eq(1);
    expect(this.data.errorConnection).to.eq('Node connection error');
    expect(wrapper.text()).to.include('Node connection error');
  });
});
