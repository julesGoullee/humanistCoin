require('dotenv').config();

module.exports = {
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || null,
  MAILCHIMP_API_KEY: process.env.MAILCHIMP_API_KEY || null,
  MAILCHIMP_LIST_ID: process.env.MAILCHIMP_LIST_ID || null,
};
