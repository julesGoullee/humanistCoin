const envParser = {

  exist: (prop, obj = process.env) => {

    return Boolean(obj[prop] && typeof obj[prop] === 'string' && obj[prop].length > 0 );

  },

  boolean: (prop, defaultVal = false, obj = process.env) => {

    if(envParser.exist(prop, obj) ){

      return obj[prop] === 'true';

    } else if (envParser.exist(`VUE_APP_${prop}`, obj) ){

      return obj[`VUE_APP_${prop}`] === 'true';

    }

    return defaultVal;

  }

};

module.exports = envParser;
