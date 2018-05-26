const rp = require('request-promise');
const config = require('./config');
const Errors = require('./utils/errors');

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

      if(error.statusCode >= 400 && error.statusCode < 500){

        Errors.throwError(error.error.message, error.error.meta, true);

      }

      Errors.throwError('server_error', { message: error.error || error.message });

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
