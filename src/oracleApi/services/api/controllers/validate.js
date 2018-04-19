const uuid = require('uuid-random');
const log = require('npmlog');

const config = require('../../../config');
const Db = require('../../../modules/db');
const Validators = require('../../../modules/validators');
const Errors = require('../../../modules/errors');

const ValidatorController = {

  validator: new Validators[config.API.VALIDATOR],
  Validator: Validators[config.API.VALIDATOR],

  async submission(params){

    const id = uuid();

    const hash = await this.validator.submission(id, params);
    const state = Validators.interface.STATES().PENDING;
    const contractValue = `${state}:${hash}`;

    Db.add(id, {
      data: params,
      id,
      address: params.address,
      state,
      hash,
      contractValue
    });

    return id;

  },

  status(id){

    const submission = Db.get(id);
    Errors.assert(submission, 'unknown_id', { id }, true);

    return submission;

  },

  callback(params){

    const res = this.validator.callback(params);
    Errors.assert(res, 'unknown_callback_id', { params }, true);

    const submission = Db.get(res.id);
    Errors.assert(submission, 'unknown_id', { params, id: res.id }, true);

    if(res.state !== submission.state){

      log.info('validate', {
        id: res.id,
        state: submission.state,
        updateState: res.state
      });

      submission.state = res.state;
      submission.contractValue =  `${submission.state}:${submission.hash}`;

    }

    return true;

  }

};

module.exports = ValidatorController;
