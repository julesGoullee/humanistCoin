const rp = require('request-promise');
const config = require('./oracleApi/config');

const ApiClient = {

  async call(method, path, body = {}){

    try {

      const res = await rp({
        method,
        uri: path,
        body,
        baseUrl: config.API.BASE_URL,
        json: true
      });

      return res;

    } catch(error){

      console.error(error.message);

      throw new Error('Api error');

    }

  },

  async info(){

    return ApiClient.call('get', '/info');

  },

  async submission(content, address){

    return ApiClient.call('post', '/submission', { content, address });

  },

  async status(id){

    return ApiClient.call('get', `/status/${id}`);

  },

  async callbackEmail(code){

    return ApiClient.call('post', '/callback', { code });

  },

};

module.exports = ApiClient;
