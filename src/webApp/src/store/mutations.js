import storeHumanist from '@/store/storeHumanist';

const mutations = {

  createWallet: (state, ethWallet) => {
    state.ethWallet = ethWallet;
  },
  createHumanist: (state, humanist) => {
    state.humanist = humanist.ethWallet.data.address;
    storeHumanist.data[humanist.ethWallet.data.address] = humanist;
  },
  nodeConnect: (state) => {
    state.nodeConnected = true;
  },
  me: (state, me) => {
    state.me = me;
  },
  submit: (state) => {
    state.submission.status = 'submit';
  },
  submitOracle: (state, submission) => {
    Object.assign(state.submission, submission);
  },
  createSubmission: (state) => {
    state.submission = {
      status: null
    };
  },
  validateSubmission: (state, status) => {
    state.submission.status = status ? 'validate' : 'rejected';
  },
  balance: (state, balance) => {
    state.balance = balance;
  },
  tx: (state, tx) => {
    state.txs.push(tx);
  }
};

export default mutations;
