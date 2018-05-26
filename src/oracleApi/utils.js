const Joi = require('joi');
const sgMail = require('@sendgrid/mail');
const config = require('./config');
const CommonUtils = require('../utils');

sgMail.setApiKey(config.SENDGRID_API_KEY);

const Errors = require('../utils/errors');

const Utils = Object.assign({}, CommonUtils, {

  joi: {

    uuid : Joi.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/),

    validateParams(params, schema){

      const result = Joi.validate(params, schema, { presence: 'required' });

      if(result.error !== null) {

        Errors.throwError('bad_params', result.error.details.map(detail => detail.message), true);

      }
    },

  },

  async sendMailCode(email, code){

    return new Promise( (resolve, reject) => {
      sgMail.send({
        from: 'kyc@humanist.network',
        to: email,
        subject: 'Validation',
        html: `Validation code: ${code}`,
      }, (err, reply) => {

        if(err){

          return reject(err);

        }

        resolve(reply);

      });

    });

  }

});

module.exports = Utils;
