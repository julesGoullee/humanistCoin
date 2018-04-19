module.exports = {

  NODE_URL: process.env.NODE_URL || '://localhost:8545',
  ENV: process.env.NODE_ENV || 'development',
  API: {
    PORT: process.env.PORT || '3000',
    VALIDATOR: 'email',
    BASE_URL: 'http://localhost:3000'
  },
  RUN: {
    VERIFY: process.env.VERIFY === 'true'
  },
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'
};
