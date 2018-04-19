const uuid = require('uuid-random');
const Joi = require('joi');
const Utils = require('../../utils');
const Validator = require('./interface');

class EmailValidator extends Validator {

  constructor(){

    super();

    this.db = {};

  }

  static schemaValidation(ctx){

    const params = {
      birthday: ctx.request.body.content.birthday,
      email: ctx.request.body.content.email,
    };
    const schema = {
      birthday: Joi.number(),
      email: Joi.string().email(),
    };

    return {
      params,
      schema
    };

  }

  static schemaCallbackValidation(ctx){

    const params = {
      code: ctx.request.body.code,
    };
    const schema = {
      code: Utils.joi.uuid,
    };

    return {
      params,
      schema
    };

  }

  async submission(id, params){

    const code = uuid();
    this.db[code] = { id };

    await Utils.sendMailCode(params.content.email, code);
    return params.content.email;

  }

  callback(params){

    if(this.db[params.code]){

      return {
        id: this.db[params.code].id,
        state: EmailValidator.STATES().CONFIRMED
      };

    }

    return false;

  }

}

module.exports = EmailValidator;
