const config = require('../config');

const createCustom = (code, meta, expose) => {

  const errorCustom = getError(code);

  if(!errorCustom){

    const error = new Error('unknown_error');

    error.status = ERRORS.unknown_error.status;
    error.meta = Object.assign({ code }, meta);


    return error;

  }

  const error = new Error(code);
  error.isCustom = true;
  error.expose = expose;

  error.status = errorCustom.status || 500;

  if(meta){

    error.meta = meta;

  }

  return error;

};

const throwError = (code, meta, expose) => {

  throw createCustom(code, meta, expose);

};

function getError(errorCode) {

  const code = ERRORS[errorCode];

  if(!errorCode || !code) {

    return null;

  }

  return code;

}

function assert(condition, message, meta, expose) {

  if(!condition){

    throwError(message, meta, expose);

  }

}

const displayError = (error) => {

  const errorCustom = getError(error.message);

  if(config.ENV !== 'production' || !errorCustom){

    console.error(Object.assign({}, error), error);

  }

  if(!errorCustom){

    return ERRORS.unknown_error.description;

  } else {

    let content = errorCustom.description;

    if(error.meta && error.expose){

      if(Array.isArray(error.meta) ){

        content += ':';

        error.meta.forEach( (item) => {

          content += ` ${item}`;

        });

      } else {

        content += Object.keys(error.meta).reduce( (acc, prop) => {

          acc += ` ${prop}: ${JSON.stringify(error.meta[prop])}`;

          return acc;

        }, '');

      }


    }

    return content;

  }

};

const ERRORS = {
  unknown_error: {
    status: 500,
    description: 'Unknown error',
  },
  access_denied: {
    status: 401,
    description: 'Access to a forbidden resource',
  },
  bad_params: {
    status: 400,
    description: 'Bad parameters',
  },
  bad_request: {
    status: 400,
    description: 'Bad request',
  },
  method_not_allowed: {
    status: 405,
    description: 'The action you want to do is not allowed',
  },
  unknown_callback_id: {
    status: 404,
    description: 'Not found',
  },
  unknown_id: {
    status: 404,
    description: 'Not found',
  },
  not_found: {
    status: 404,
    description: 'Not found',
  },
  already_exists: {
    status: 400,
    description: 'Entity already exists',
  },
  bad_credentials: {
    status: 401,
    description: 'Bad credentials',
  },

  entry_not_found: {
    status: 400,
    description: 'Cannot find entry in db',
  },

  response_error: {
    description: 'Request error',
  },
  unknown_blockchain_error: {
    description: 'Unknown blockchain error',
  },
  server_error: {
    description: 'Server error',
  },
  humanist_already_exist: {
    description: 'Humanist already exist',
  },
  node_connection_error: {
    description: 'Node connection error',
  },
  invalid_submission_status: {
    description: 'Invalid submission status',
  },
  tx_failed_humanist_already_exist_or_unknown: {
    description: 'Tx failed humanist already exist or unknown error',
  },
  not_enough_balance: {
    description: 'Not enough balance',
  },
  insufficient_fund: {
    description: 'Insufficient fund',
  },
  insufficient_fund_eth: {
    description: 'Insufficient fund eth',
  }
};

module.exports = {
  createCustom,
  throwError,
  displayError,
  assert,
  ERRORS,
};

/****
 HTTP ERROR CODES

 100 "continue"
 101 "switching protocols"
 102 "processing"
 200 "ok"
 201 "created"
 202 "accepted"
 203 "non-authoritative information"
 204 "no content"
 205 "reset content"
 206 "partial content"
 207 "multi-status"
 208 "already reported"
 226 "im used"
 300 "multiple choices"
 301 "moved permanently"
 302 "found"
 303 "see other"
 304 "not modified"
 305 "use proxy"
 307 "temporary redirect"
 308 "permanent redirect"
 400 "bad request"
 401 "unauthorized"
 402 "payment required"
 403 "forbidden"
 404 "not found"
 405 "method not allowed"
 406 "not acceptable"
 407 "proxy authentication required"
 408 "request timeout"
 409 "conflict"
 410 "gone"
 411 "length required"
 412 "precondition failed"
 413 "payload too large"
 414 "uri too long"
 415 "unsupported media type"
 416 "range not satisfiable"
 417 "expectation failed"
 418 "I'm a teapot"
 422 "unprocessable entity"
 423 "locked"
 424 "failed dependency"
 426 "upgrade required"
 428 "precondition required"
 429 "too many requests"
 431 "request header fields too large"
 500 "internal server error"
 501 "not implemented"
 502 "bad gateway"
 503 "service unavailable"
 504 "gateway timeout"
 505 "http version not supported"
 506 "variant also negotiates"
 507 "insufficient storage"
 508 "loop detected"
 510 "not extended"
 511 "network authentication required"
 */
