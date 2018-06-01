import storeHumanist from '@/store/storeHumanist';

const getters = {

  submission: state => state.submission,
  me: state => state.me,
  txs: state => state.txs,
  balance: state => state.balance,
  nodeConnected: state => state.nodeConnected,
  ethWallet: state => state.ethWallet,
  humanist: state => storeHumanist.data[state.humanist] || null

};

export default getters;
