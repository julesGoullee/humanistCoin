import assert from 'assert';
import ApiClient from '@/../../apiClient';
import EthWallet from '@/../../ethWallet';
import Humanist from '@/../../humanist';
import config from '@/../../config';
import storeHumanist from '@/store/storeHumanist';
import Errors from '@/../../utils/errors';
import ethers from 'ethers';

const moment = require('moment');

const actions = {

  nodeConnect: async ({ state, commit }) => {
    assert(!state.nodeConnected, 'node_already_connected');
    await EthWallet.initNode();

    if (config.FETCH_API_CONTRACT) {
      const info = await ApiClient.info();
      config.CONTRACT_ADDRESS = info.contractAddress;
    }

    commit('nodeConnect', {
      meta: {
        analytics: [
          ['event', {
            eventCategory: 'connection',
            eventAction: 'nodeConnect',
            eventLabel: 'Node connection ',
            eventValue: 1
          }]
        ]
      }
    });
  },
  createWallet: async ({ state, commit, dispatch }, { privateKey }) => {
    assert(!state.ethWallet, 'wallet_eth_already_exist');
    assert(!storeHumanist.data[state.humanist], 'humanist_already_exist');
    const ethWallet = new EthWallet({ privateKey });
    await ethWallet.open();
    commit('createWallet', {
      ethWallet,
      meta: {
        analytics: [
          ['event', {
            eventCategory: 'connection',
            eventAction: 'eth_wallet',
            eventLabel: 'Ethereum wallet',
            eventValue: 1
          }]
        ]
      }
    });

    await dispatch('createHumanist');
  },
  submit: async ({ state, commit, dispatch }, { email, birthday }) => {
    assert(state.submission && state.submission.status === null, 'humanist_already_validate');
    assert(!state.me || !state.me.validate, 'humanist_already_validate');
    assert(storeHumanist.data[state.humanist], 'unknown_humanist');

    commit('submit', {
      meta: {
        analytics: [
          ['event', {
            eventCategory: 'submission',
            eventAction: 'submit',
            eventLabel: 'submit',
            eventValue: birthday.unix()
          }]
        ]
      }
    });

    if (config.RUN.VERIFY) {
      await dispatch('submitOracle', { email, birthday });
    } else {
      commit('submitOracle', {
        submission: {
          email,
          birthday: birthday.format(),
          id: 'id',
          status: 'CONFIRMED'
        },
        meta: {
          analytics: [
            ['event', {
              eventCategory: 'submission',
              eventAction: 'submitOracle',
              eventLabel: 'submit oracle',
              eventValue: birthday.unix()
            }]
          ]
        }
      });

      await dispatch('submitBC');
    }
  },
  submitOracle: async ({ state, commit, dispatch }, { email, birthday }) => {
    assert(state.submission && state.submission.status === 'submit', 'existing_submission');
    assert(!state.me || !state.me.validate, 'humanist_already_validate');
    assert(storeHumanist.data[state.humanist], 'unknown_humanist');

    const content = {
      email,
      birthday: birthday.format()
    };

    try {
      const submission = await ApiClient.submission(content, storeHumanist.data[state.humanist].ethWallet.data.address);
      commit('submitOracle', {
        submission: Object.assign({}, content, submission),
        meta: {
          analytics: [
            ['event', {
              eventCategory: 'submission',
              eventAction: 'submitOracle',
              eventLabel: 'submit oracle',
              eventValue: birthday.unix()
            }]
          ]
        }
      });
    } catch (error) {
      commit('createSubmission', {
        meta: {
          analytics: [
            ['event', {
              eventCategory: 'submission',
              eventAction: 'createSubmission',
              eventLabel: 'create submission',
              eventValue: 0
            }]
          ]
        }
      });

      throw error;
    }
  },
  submitCode: async ({ state, commit, dispatch }, { code }) => {
    assert(state.submission && state.submission.status === 'PENDING', 'unknown_submission');
    assert(!state.me || !state.me.validate, 'humanist_already_validate');
    assert(storeHumanist.data[state.humanist], 'unknown_humanist');

    const submission = await ApiClient.callbackEmail(code);

    commit('submitOracle', {
      submission,
      meta: {
        analytics: [
          ['event', {
            eventCategory: 'submission',
            eventAction: 'submitOracle',
            eventLabel: 'submit oracle',
            eventValue: moment(submission.birthday).unix()
          }]
        ]
      }
    });

    if (submission.status === 'CONFIRMED') {
      await dispatch('submitBC');
    } else if (submission.status === 'REJECTED') {
      commit('createSubmission', {
        meta: {
          analytics: [
            ['event', {
              eventCategory: 'submission',
              eventAction: 'createSubmission',
              eventLabel: 'create submission',
              eventValue: 0
            }]
          ]
        }
      });
      Errors.throwError('invalid_submission_status', submission.status, true);
    }
  },
  submitBC: async ({ state, commit, dispatch }) => {
    assert(state.submission && state.submission.status === 'CONFIRMED', 'invalid_submission');
    assert(!state.me || !state.me.validate, 'humanist_already_validate');
    assert(storeHumanist.data[state.humanist], 'unknown_humanist');

    await storeHumanist.data[state.humanist].listen();
    if (config.RUN.VERIFY) {
      dispatch('watchValidation');
    }
    const res = await storeHumanist.data[state.humanist].add({
      birthday: moment(state.submission.birthday).unix(),
      email: state.submission.email,
      id: state.submission.id
    });

    if (!res) {
      commit('createSubmission', {
        meta: {
          analytics: [
            ['event', {
              eventCategory: 'submission',
              eventAction: 'createSubmission',
              eventLabel: 'create submission',
              eventValue: 0
            }]
          ]
        }
      });
      Errors.throwError('humanist_already_exist', {}, true);
    }

    if (!config.RUN.VERIFY) {
      commit('validateSubmission', {
        status: true,
        meta: {
          analytics: [
            ['event', {
              eventCategory: 'submission',
              eventAction: 'validateSubmission',
              eventLabel: 'validate submission',
              eventValue: 1
            }]
          ]
        }
      });
      await dispatch('me');
    }
  },
  validateSubmission: async ({ state, commit, dispatch }, result) => {
    assert(storeHumanist.data[state.humanist], 'unknown_humanist');
    assert(!state.me || !state.me.validate, 'humanist_already_validate');
    commit('validateSubmission', {
      status: result.status,
      meta: {
        analytics: [
          ['event', {
            eventCategory: 'submission',
            eventAction: 'validateSubmission',
            eventLabel: 'validate submission',
            eventValue: result.status ? 1 : 0
          }]
        ]
      }
    });

    if (result.status) {
      await dispatch('me');
    }
  },
  watchValidation: ({ state, commit, dispatch }) => {
    assert(storeHumanist.data[state.humanist], 'unknown_humanist');
    assert(!state.me || !state.me.validate, 'humanist_already_validate');

    storeHumanist.data[state.humanist].on('validate', async (result) => {
      await dispatch('validateSubmission', {
        status: result.status,
        meta: {
          analytics: [
            ['event', {
              eventCategory: 'submission',
              eventAction: 'validateSubmission',
              eventLabel: 'validate submission',
              eventValue: result.status ? 1 : 0
            }]
          ]
        }
      });
    });
  },
  createHumanist: async ({ state, commit, dispatch }) => {
    assert(state.ethWallet, 'unknown_wallet_eth');
    assert(!storeHumanist.data[state.humanist], 'humanist_already_exist');

    const contract = Humanist.getContract(config.CONTRACT_ADDRESS, state.ethWallet);
    const humanist = new Humanist(state.ethWallet, contract);

    commit('createHumanist', {
      humanist,
      meta: {
        analytics: [
          ['event', {
            eventCategory: 'connection',
            eventAction: 'createHumanist',
            eventLabel: 'create humanist',
            eventValue: 1
          }]
        ]
      }
    });
    await dispatch('me');
  },
  me: async ({ state, commit, dispatch }) => {
    assert(storeHumanist.data[state.humanist], 'unknown_humanist');

    const me = await storeHumanist.data[state.humanist].me();

    if (me && me.validate) {
      commit('me', {
        me,
        meta: {
          analytics: [
            ['event', {
              eventCategory: 'connection',
              eventAction: 'me',
              eventLabel: 'me',
              eventValue: 1
            }]
          ]
        }
      });
      await storeHumanist.data[state.humanist].listen();

      await dispatch('balance');
      await dispatch('txHistory');
      dispatch('watchTx');
      dispatch('watchBalance');
    } else {
      const oldStatus = state.submission && state.submission.status;
      commit('createSubmission', {
        meta: {
          analytics: [
            ['event', {
              eventCategory: 'submission',
              eventAction: 'createSubmission',
              eventLabel: 'create submission',
              eventValue: 1
            }]
          ]
        }
      });

      if (oldStatus === 'validate') {
        Errors.throwError('tx_failed_humanist_already_exist_or_unknown', {}, true);
      }
    }
  },
  send: async ({ state, commit, dispatch }, { address, amount }) => {
    assert(storeHumanist.data[state.humanist], 'unknown_humanist');
    assert(state.me && state.me.validate, 'humanist_not_validate');

    const res = await storeHumanist.data[state.humanist].send(address, amount);
    assert(res, 'send_fail');
  },
  balance: async ({ state, commit }) => {
    assert(storeHumanist.data[state.humanist], 'unknown_humanist');
    assert(state.me && state.me.validate, 'humanist_not_validate');

    const balance = await storeHumanist.data[state.humanist].balance();

    commit('balance', {
      balance,
      meta: {
        analytics: [
          ['event', {
            eventCategory: 'balance',
            eventAction: 'balance',
            eventLabel: 'balance',
            eventValue: parseInt(ethers.utils.parseEther(balance).toString())
          }]
        ]
      }
    });
  },
  watchBalance: ({ state, commit }) => {
    assert(storeHumanist.data[state.humanist], 'unknown_humanist');
    assert(state.me && state.me.validate, 'humanist_not_validate');

    storeHumanist.data[state.humanist].on('balance', async (balance) => {
      commit('balance', {
        balance,
        meta: {
          analytics: [
            ['event', {
              eventCategory: 'balance',
              eventAction: 'balance',
              eventLabel: 'balance',
              eventValue: parseInt(ethers.utils.parseEther(balance).toString())
            }]
          ]
        }
      });
    });
  },
  txHistory: async ({ state, commit }) => {
    assert(storeHumanist.data[state.humanist], 'unknown_humanist');
    assert(state.me && state.me.validate, 'humanist_not_validate');

    const txs = await storeHumanist.data[state.humanist].txHistory();
    txs.map(tx => commit('tx', {
      tx,
      meta: {
        analytics: [
          ['event', {
            eventCategory: 'balance',
            eventAction: 'balance',
            eventLabel: 'balance',
            eventValue: parseInt(ethers.utils.parseEther(tx.amount).toString())
          }]
        ]
      }
    }));
  },
  watchTx: ({ state, commit }) => {
    assert(storeHumanist.data[state.humanist], 'unknown_humanist');
    assert(state.me && state.me.validate, 'humanist_not_validate');

    storeHumanist.data[state.humanist].on('tx', async (tx) => {
      commit('tx', {
        tx,
        meta: {
          analytics: [
            ['event', {
              eventCategory: 'balance',
              eventAction: 'balance',
              eventLabel: 'balance',
              eventValue: parseInt(ethers.utils.parseEther(tx.amount).toString())
            }]
          ]
        }
      });
    });
  }

};

export default actions;
