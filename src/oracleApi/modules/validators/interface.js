
class Validator {

  static STATES(){

    return {
      PENDING: 'PENDING',
      CONFIRMED: 'CONFIRMED',
      REJECTED: 'REJECTED',
    };

  }

  static schemaValidation(ctx){ // eslint-disable-line no-unused-vars

    throw new Error('not_implemented');

  }

  static schemaCallbackValidation(ctx){ // eslint-disable-line no-unused-vars

    throw new Error('not_implemented');

  }

  async submission(params){ // eslint-disable-line no-unused-vars

    throw new Error('not_implemented');

  }

  callback(params){ // eslint-disable-line no-unused-vars

    throw new Error('not_implemented');

  }

}

module.exports = Validator;
