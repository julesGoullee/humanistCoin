import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';

import Submission from '@/components/Submission.vue';
const moment = require('moment');

describe('Components: Submission', function () {
  beforeEach(() => {
    this.sandbox = createSandbox();
    this.localVue = createLocalVue();
    this.localVue.use(Vuex);

    this.stubs = {
      actions: {
        submit: this.sandbox.stub(),
        submitCode: this.sandbox.stub()
      },
      getters: {
        submission: this.sandbox.stub(),
        me: this.sandbox.stub()
      }
    };
    this.store = new Vuex.Store(this.stubs);
    const now = moment();

    const data = {
      now,
      birthday: {
        day: now.date(),
        month: now.month(),
        year: now.year() - 29
      },
      email: '',
      errors: []
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

  it('Should render form', async () => {
    this.stubs.getters.submission.returns({ status: null });
    const wrapper = shallowMount(Submission, this.shallowConfig);

    const optionsMonth = wrapper.find('#month').findAll('option');
    expect(optionsMonth.length).to.eq(13);
    expect(optionsMonth.at(0).text()).to.eq('Month');
    expect(optionsMonth.at(0).attributes().value).to.eq('0');
    expect(optionsMonth.at(6).text()).to.eq('Jun');
    expect(optionsMonth.at(6).attributes().value).to.eq('6');
    // expect(optionsMonth.at(7).attributes().selected).to.be.eq('selected');

    const optionsDay = wrapper.find('#day').findAll('option');
    expect(optionsDay.length).to.eq(32);
    expect(optionsDay.at(0).text()).to.eq('Day');
    expect(optionsDay.at(0).attributes().value).to.eq('0');
    expect(optionsDay.at(15).text()).to.eq('15');
    expect(optionsDay.at(15).attributes().value).to.eq('15');
    // expect(optionsDay.at(moment().day() + 1).attributes().selected).to.be.eq('selected');

    const optionsYear = wrapper.find('#year').findAll('option');
    expect(optionsYear.length).to.eq(101);
    expect(optionsYear.at(0).text()).to.eq('Year');
    expect(optionsYear.at(0).attributes().value).to.eq('0');
    expect(optionsYear.at(50).text()).to.eq((moment().year() - 50).toString());
    expect(optionsYear.at(50).attributes().value).to.eq((moment().year() - 50).toString());
    // expect(optionsYear.at(30).attributes().selected).to.be.eq('selected');
  });

  it('Should display errors form', async () => {
    this.stubs.getters.submission.returns({ status: null });

    const wrapper = shallowMount(Submission, this.shallowConfig);
    wrapper.find('#submit').trigger('submit');

    expect(wrapper.find('#errors').find('div').text()).to.include('Email is required');
    expect(wrapper.find('#errors').find('div').text()).not.to.include('Day is required');
    expect(wrapper.find('#errors').find('div').text()).not.to.include('Month is required');
    expect(wrapper.find('#errors').find('div').text()).not.to.include('Year is required');

    const inputEmail = wrapper.find('#email');
    inputEmail.element.value = 'email';
    inputEmail.trigger('input');
    wrapper.find('#submit').trigger('submit');
    expect(wrapper.find('#errors').exists()).to.be.false;

    const selectDay = wrapper.find('#day');
    selectDay.findAll('option').at(0).element.selected = true;
    selectDay.trigger('change');
    wrapper.find('#submit').trigger('submit');
    expect(wrapper.find('#errors').find('div').text()).to.include('Day is required');

    const selectMonth = wrapper.find('#month');
    selectMonth.findAll('option').at(0).element.selected = true;
    selectMonth.trigger('change');
    wrapper.find('#submit').trigger('submit');
    expect(wrapper.find('#errors').html()).to.include('Month is required');

    const selectYear = wrapper.find('#year');
    selectYear.findAll('option').at(0).element.selected = true;
    selectYear.trigger('change');
    wrapper.find('#submit').trigger('submit');
    expect(wrapper.find('#errors').find('div').text()).to.include('Year is required');

    expect(wrapper.find('#errors').find('div').text()).to.include('Day is required');
    expect(wrapper.find('#errors').find('div').text()).to.include('Month is required');
  });

  it('Should display error with invalid date', () => {
    this.stubs.getters.submission.returns({ status: null });
    const wrapper = shallowMount(Submission, this.shallowConfig);

    const inputEmail = wrapper.find('#email');
    inputEmail.element.value = 'email';
    inputEmail.trigger('input');
    wrapper.find('#submit').trigger('submit');

    const selectYear = wrapper.find('#year');
    selectYear.findAll('option').at(100).element.selected = true;
    selectYear.trigger('change');
    wrapper.find('#submit').trigger('submit');

    expect(wrapper.find('#errors').find('div').text()).to.include('Birthday is invalid');
  });

  it('Should submit valid form', () => {
    this.stubs.getters.submission.returns({ status: null });
    const wrapper = shallowMount(Submission, this.shallowConfig);
    const inputEmail = wrapper.find('#email');
    inputEmail.element.value = 'email';
    inputEmail.trigger('input');
    wrapper.find('#submit').trigger('submit');

    const now = moment();
    const date = moment({
      day: now.date(),
      month: now.month() - 1,
      year: now.year() - 29
    });
    expect(this.stubs.actions.submit.calledOnce).to.be.true;
    expect(this.stubs.actions.submit.args[0][1].email).to.be.eq('email');
    expect(this.stubs.actions.submit.args[0][1].birthday.format()).to.be.eq(date.format());
  });

  it('Should show when waiting validation when is CONFIRMED', () => {
    this.stubs.getters.submission.returns({ status: 'CONFIRMED' });
    const wrapper = shallowMount(Submission, this.shallowConfig);
    expect(wrapper.find('div').text()).to.include('Account is creating');
    expect(wrapper.find('#submission-form').exists()).to.be.false;
  });

  it('Should show when waiting email code when status is PENDING', () => {
    this.stubs.getters.submission.returns({ status: 'PENDING' });
    const wrapper = shallowMount(Submission, this.shallowConfig);
    expect(wrapper.find('#submission-form').exists()).to.be.false;
    expect(wrapper.find('#submission-oracle-form').exists()).to.be.true;
  });

  it('Should display error submit email code', () => {
    this.stubs.getters.submission.returns({ status: 'PENDING' });
    const wrapper = shallowMount(Submission, this.shallowConfig);
    wrapper.find('#submit-email-code').trigger('submit');
    expect(wrapper.find('#errors').find('div').text()).to.include('Code is required');
  });

  it('Should submit email code', () => {
    this.stubs.getters.submission.returns({ status: 'PENDING' });
    const wrapper = shallowMount(Submission, this.shallowConfig);
    const inputEmailCode = wrapper.find('#email-code');
    inputEmailCode.element.value = 'code';
    inputEmailCode.trigger('input');
    wrapper.find('#submit-email-code').trigger('submit');
    expect(this.stubs.actions.submitCode.calledOnce).to.be.true;
    expect(this.stubs.actions.submitCode.args[0][1].code).to.be.eq('code');
  });
});
