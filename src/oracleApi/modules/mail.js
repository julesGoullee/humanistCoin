const Mailchimp = require('mailchimp-api-v3');
const moment = require('moment');
const config = require('../config');

const Mail = {

  add: async (email, birthday) => {

    if(!Mail.mailchimp){

      return true;

    }

    return Mail.mailchimp.post(`/lists/${config.MAILCHIMP_LIST_ID}/members`, {
      email_address : email,
      status : 'subscribed',
      merge_fields: {
        BIRTHDAY: moment(birthday).format('YYYY-MM-DD')
      }
    });

  }

};

if(config.MAILCHIMP_API_KEY){

  Mail.mailchimp = new Mailchimp(config.MAILCHIMP_API_KEY);

}

module.exports = Mail;
