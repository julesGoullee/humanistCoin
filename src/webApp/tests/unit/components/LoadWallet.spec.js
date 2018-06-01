import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';

import LoadWallet from '@/components/LoadWallet.vue';
import EthWallet from '@/../../ethWallet';

describe('Components: LoadWallet', function () {
  beforeEach(() => {
    this.sandbox = createSandbox();
    this.localVue = createLocalVue();
    this.localVue.use(Vuex);

    this.stubs = {
      actions: {
        createWallet: this.sandbox.stub()
      },
      getters: {
        ethWallet: this.sandbox.stub()
      }
    };
    this.store = new Vuex.Store({
      actions: {
        createWallet: this.stubs.actions.createWallet
      },
      getters: {
        ethWallet: this.stubs.getters.ethWallet
      }
    });

    this.spyValidatePrivateKey = this.sandbox.spy(EthWallet, 'validatePrivateKey');

    const data = {
      privateKey: null,
      isValidPrivateKey: false
    };

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

  it('Should render enter keys', () => {
    const privateKey = '0xab59880747729d1a7371ed540af068b75781d3e9344d9a904a045fca5040c0e7';
    this.stubs.getters.ethWallet.returns(null);
    const wrapper = shallowMount(LoadWallet, this.shallowConfig);

    expect(wrapper.text()).to.include('Enter private key:');

    const input = wrapper.find('input');
    input.element.value = privateKey;
    input.trigger('input');
    expect(this.spyValidatePrivateKey.calledOnce).to.be.true;
    expect(this.spyValidatePrivateKey.calledWith(privateKey)).to.be.true;
    expect(this.stubs.actions.createWallet.calledOnce).to.be.true;
    expect(this.stubs.actions.createWallet.args[0][1].privateKey).to.be.eq(privateKey);
  });

  it('Cannot change input if is valid', () => {
    const privateKey = '0xab59880747729d1a7371ed540af068b75781d3e9344d9a904a045fca5040c0e7';
    this.stubs.getters.ethWallet.returns(null);
    const wrapper = shallowMount(LoadWallet, this.shallowConfig);

    expect(wrapper.text()).to.include('Enter private key:');

    const input = wrapper.find('input');
    input.element.value = privateKey;
    input.trigger('input');
    expect(this.spyValidatePrivateKey.callCount).to.eq(1);
    input.element.value = 'privateKey';
    input.trigger('input');
    expect(this.spyValidatePrivateKey.callCount).to.eq(1);
  });

  it('Should render opening wallet', () => {
    this.stubs.getters.ethWallet.returns({
      opened: false
    });
    const wrapper = shallowMount(LoadWallet, this.shallowConfig);

    expect(wrapper.text()).to.include('Open wallet ...');
  });

  it('Should render opened wallet', () => {
    this.stubs.getters.ethWallet.returns({
      opened: true
    });
    const wrapper = shallowMount(LoadWallet, this.shallowConfig);

    expect(wrapper.text()).to.include('Wallet opened!');
  });
});
