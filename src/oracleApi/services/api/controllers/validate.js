const uuid = require('uuid-random');
const log = require('npmlog');

const config = require('../../../../config');
const Db = require('../../../modules/db');
const Validators = require('../../../modules/validators');
const Errors = require('../../../../utils/errors');

const ValidatorController = {

  validator: new Validators[config.API.VALIDATOR],
  Validator: Validators[config.API.VALIDATOR],

  async submission(params){

    const id = uuid();

    const hash = await this.validator.submission(id, params);
    const status = Validators.interface.STATUS().PENDING;
    const contractValue = `${status}:${hash}`;

    const submission = {
      content: params.content,
      id,
      address: params.address,
      status,
      hash,
      contractValue
    };

    Db.add(id, submission);

    return ValidatorController._filterSubmission(submission);

  },

  status(id){

    const submission = Db.get(id);
    Errors.assert(submission, 'unknown_id', { id }, true);

    return ValidatorController._filterSubmission(submission);

  },

  callback(params){

    const res = this.validator.callback(params);
    Errors.assert(res, 'unknown_callback_id', { params }, true);

    const submission = Db.get(res.id);
    Errors.assert(submission, 'unknown_id', { params, id: res.id }, true);

    if(res.status !== submission.status){

      log.info('validate', {
        id: res.id,
        status: submission.status,
        updateState: res.status
      });

      submission.status = res.status;
      submission.contractValue =  `${submission.status}:${submission.hash}`;

    }

    return ValidatorController._filterSubmission(submission);

  },

  _filterSubmission(submission){

    const res = Object.assign({}, submission);
    delete res.content;
    return res;

  }

};

module.exports = ValidatorController;
