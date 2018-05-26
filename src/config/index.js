const envParser = require('../utils/envParser');

module.exports = {

  NODE_URL: process.env.NODE_URL || process.env.VUE_APP_NODE_URL ||'http://localhost:8545',
  NODE_URL_WS: process.env.NODE_URL_WS || process.env.VUE_APP_NODE_URL_WS || 'ws://localhost:8545',
  NETWORK: process.env.NETWORK || process.env.VUE_APP_NETWORK || 'kovan',
  ENV: process.env.ENV || process.env.VUE_APP_ENV || 'development',
  FETCH_API_CONTRACT: envParser.boolean('FETCH_API_CONTRACT', true),
  API: {
    PORT: process.env.API_PORT || process.env.VUE_APP_API_PORT || '3000',
    VALIDATOR: 'email',
    BASE_URL: process.env.API_BASE_URL || process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000'
  },
  WEB_APP: {
    BASE_URL: process.env.WEB_APP_BASE_URL || process.env.VUE_APP_WEB_APP_BASE_URL || 'http://localhost:8080'
  },
  RUN: {
    VERIFY: envParser.boolean('VERIFY', true)
  },
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || process.env.VUE_APP_CONTRACT_ADDRESS
  || '0xb66F88A3fD320dB1d85374993A66D03B4F2D0a96'
};
