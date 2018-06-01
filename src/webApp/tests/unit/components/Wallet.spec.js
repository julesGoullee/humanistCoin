import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';

import Wallet from '@/components/Wallet.vue';
import { nowInSecond } from '@/../../utils';

describe('Components: Wallet', function () {
  beforeEach(() => {
    this.sandbox = createSandbox();
    this.localVue = createLocalVue();
    this.localVue.use(Vuex);

    this.stubs = {
      actions: {
        send: this.sandbox.stub()
      },
      getters: {
        me: this.sandbox.stub(),
        txs: this.sandbox.stub().returns([]),
        ethWallet: this.sandbox.stub(),
        balance: this.sandbox.stub()
      }
    };
    this.store = new Vuex.Store({
      actions: {
        send: this.stubs.actions.send
      },
      getters: {
        me: this.stubs.getters.me,
        ethWallet: this.stubs.getters.ethWallet,
        txs: this.stubs.getters.txs,
        balance: this.stubs.getters.balance
      }
    });

    this.shallowConfig = { store: this.store, localVue: this.localVue };
  });

  afterEach(() => {
    this.sandbox.restore();
  });

  it('Should render wallet info', () => {
    this.stubs.getters.ethWallet.returns({
      data: {
        address: 'address'
      }
    });
    this.stubs.getters.me.returns({
      birthday: nowInSecond(),
      hash: 'hash',
      createdAt: nowInSecond(),
      validate: true
    });
    this.stubs.getters.balance.returns('balance');
    const wrapper = shallowMount(Wallet, this.shallowConfig);

    expect(wrapper.find('div').text()).to.include('Address: address');
    expect(wrapper.find('div').text()).to.include('Birthday:');
    expect(wrapper.find('div').text()).to.include('Hash: hash');
    expect(wrapper.find('div').text()).to.include('Created at:');
    expect(wrapper.find('div').text()).to.include('Validate: true');
    expect(wrapper.find('div').text()).to.include('Balance: balance');
    expect(wrapper.find('div').text()).to.include('Any transaction');
  });

  it('Cannot render balance balance if not exist', () => {
    this.stubs.getters.ethWallet.returns({
      data: {
        address: 'address'
      }
    });
    this.stubs.getters.me.returns({
      birthday: nowInSecond(),
      hash: 'hash',
      createdAt: nowInSecond(),
      validate: true
    });
    this.stubs.getters.balance.returns(null);
    const wrapper = shallowMount(Wallet, this.shallowConfig);

    expect(wrapper.find('div').text()).to.not.include('Balance:');
  });

  it('Should render transaction', () => {
    this.stubs.getters.ethWallet.returns({
      data: {
        address: 'address'
      }
    });
    this.stubs.getters.me.returns({
      birthday: nowInSecond(),
      hash: 'hash',
      createdAt: nowInSecond(),
      validate: true
    });

    this.stubs.getters.txs.returns([
      {
        from: 'from',
        to: 'to',
        amount: '1',
        fee: '0.1',
        blockNumber: '1',
        blockHash: 'blockHash',
        type: 'in',
        transactionHash: 'transactionHash'
      }
    ]);
    const wrapper = shallowMount(Wallet, this.shallowConfig);
    expect(wrapper.find('.transaction').text()).to.include('BlockNumber: 1');
    expect(wrapper.find('.transaction').text()).to.include('BlockHash: blockHash');
    expect(wrapper.find('.transaction').text()).to.include('TransactionHash: transactionHash');
    expect(wrapper.find('.transaction').text()).to.include('Type: in');
    expect(wrapper.find('.transaction').text()).to.include('From: from');
    expect(wrapper.find('.transaction').text()).to.include('To: to');
    expect(wrapper.find('.transaction').text()).to.include('Amount: 1');
    expect(wrapper.find('.transaction').text()).to.include('Fee: 0.1');
  });

  it('Should render more one transaction', () => {
    this.stubs.getters.ethWallet.returns({
      data: {
        address: 'address'
      }
    });
    this.stubs.getters.me.returns({
      birthday: nowInSecond(),
      hash: 'hash',
      createdAt: nowInSecond(),
      validate: true
    });

    this.stubs.getters.txs.returns([
      {
        from: 'from',
        to: 'to',
        amount: '1',
        fee: '0.1',
        blockNumber: '1',
        blockHash: 'blockHash',
        transactionHash: 'transactionHash'
      },
      {
        from: 'from1',
        to: 'to1',
        amount: '1',
        fee: '0.1',
        blockNumber: '1',
        blockHash: 'blockHash1',
        transactionHash: 'transactionHash1'
      }
    ]);
    const wrapper = shallowMount(Wallet, this.shallowConfig);
    expect(wrapper.findAll('.transaction').length).to.be.eq(2);
  });

  it('Should send', async () => {
    this.stubs.getters.ethWallet.returns({
      data: {
        address: 'address'
      }
    });
    this.stubs.getters.me.returns({
      birthday: nowInSecond(),
      hash: 'hash',
      createdAt: nowInSecond(),
      validate: true
    });
    this.stubs.getters.balance.returns('1');
    const wrapper = shallowMount(Wallet, this.shallowConfig);
    const inputAddress = wrapper.find('#send-address');
    inputAddress.element.value = 'address';
    inputAddress.trigger('input');

    const inputAmount = wrapper.find('#send-amount');
    inputAmount.element.value = '0.1';
    inputAmount.trigger('input');

    wrapper.find('#send-submit').trigger('submit');
    expect(this.stubs.actions.send.calledOnce).to.be.true;
    expect(this.stubs.actions.send.args[0][1].address).to.be.eq('address');
    expect(this.stubs.actions.send.args[0][1].amount).to.be.eq('0.1');
    await this.localVue.nextTick();
    expect(wrapper.find('#send-address').element.value).to.eq('');
    expect(wrapper.find('#send-amount').element.value).to.eq('');
  });

  it('Should show when waiting send', async () => {
    this.stubs.getters.ethWallet.returns({
      data: {
        address: 'address'
      }
    });
    this.stubs.getters.me.returns({
      birthday: nowInSecond(),
      hash: 'hash',
      createdAt: nowInSecond(),
      validate: true
    });
    this.stubs.getters.balance.returns('1');

    const wrapper = shallowMount(Wallet, this.shallowConfig);
    const inputAddress = wrapper.find('#send-address');
    inputAddress.element.value = 'address';
    inputAddress.trigger('input');

    const inputAmount = wrapper.find('#send-amount');
    inputAmount.element.value = '0.1';
    inputAmount.trigger('input');

    wrapper.find('#send-submit').trigger('submit');

    expect(wrapper.find('div').text()).to.include('Transaction is sending');
    expect(wrapper.find('#send-form').exists()).to.be.false;
    await this.localVue.nextTick();
    expect(wrapper.find('#send-form').exists()).to.be.true;
    expect(wrapper.find('#send-waiting').exists()).to.be.false;
  });
});
