const uuid = require('uuid-random');
const Joi = require('joi');
const Utils = require('../../utils');
const Validator = require('./interface');
const config = require('../../config');

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
      birthday: Joi.date(),
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

    let code = null;

    if(!config.SENDGRID_API_KEY){

      code = '00000000-0000-0000-0000-000000000000';

    } else {

      code = uuid();
      await Utils.sendMailCode(params.content.email, code);

    }

    this.db[code] = { id };

    return params.content.email;

  }

  callback(params){

    if(this.db[params.code]){

      const id = this.db[params.code].id;
      delete this.db[params.code];

      return {
        id,
        status: Validator.STATUS().CONFIRMED
      };

    }

    return false;

  }

}

module.exports = EmailValidator;
