const Koa = require('koa');
const cors = require('@koa/cors');
const cacheControl = require('koa-cache-control');
const bodyParser = require('koa-bodyparser');
const router = require('koa-router')();
const Joi = require('joi');

const config = require('../../../config');
const Utils = require('../../utils');
const log = require('npmlog');
const ValidatorController = require('./controllers/validate');
const Errors = require('../../../utils/errors');

async function logger(ctx, next){

  if(ctx.request.method === 'OPTIONS') {

    return next();

  }

  ctx.requestInfo = {
    start: Date.now(),
    path: ctx.request.path,
    method: ctx.request.method,
    ip: ctx.request.ip,
    url: ctx.request.url,
    host: ctx.request.host,
    protocol: ctx.request.protocol
  };

  await next();

  ctx.requestInfo.status = ctx.status;
  const now = Date.now();
  ctx.requestInfo.time = now - ctx.requestInfo.start;
  ctx.requestInfo.end = now;

  log.info('http', 'API request', ctx.requestInfo);

}

const App = {

  async info(ctx){

    ctx.body = {
      contractAddress: config.CONTRACT_ADDRESS
    };

  },

  async submission(ctx){

    const content = ValidatorController.Validator.schemaValidation(ctx);

    const params = {
      address: ctx.request.body.address,
      content: content.params
    };
    const schema = {
      address: Joi.string(),
      content: content.schema
    };


    Utils.joi.validateParams(params, schema);

    ctx.body = await ValidatorController.submission(params);

  },

  async status(ctx){

    const params = { id: ctx.params.id };
    const schema = { id: Joi.string() };

    Utils.joi.validateParams(params, schema);

    ctx.body = await ValidatorController.status(params.id);

  },

  async callback(ctx){

    const { params, schema } = ValidatorController.Validator.schemaCallbackValidation(ctx);

    Utils.joi.validateParams(params, schema);

    ctx.body = await ValidatorController.callback(params);

  },

  async start(){

    App.server = new Koa();

    App.server.on('error', (error) => {

      if(error.isCustom){

        log.warn('http', 'API error', {
          message: error.message,
          meta: error.meta
        });

      } else {

        log.error('http', 'Unexpected API error', error);

      }

    });

    App.server.use(async (ctx, next) => {

      try {

        await next();

      } catch (err){

        ctx.status = err.status || 500;
        ctx.body = {};

        if(err.isCustom && err.expose || config.ENV !== 'production'){

          ctx.body.message = err.message || Error.ERRORS.unknown_error.description;

          if(err.meta){

            ctx.body.meta = err.meta;

          }

        } else {

          ctx.body = Errors.ERRORS.unknown_error.description;

        }

        ctx.app.emit('error', err, ctx);

      }

    });

    router.get('/info', App.info);

    router.post('/submission', App.submission);

    router.get('/status/:id', App.status);

    router.post('/callback', App.callback);


    App.server.use(logger);
    App.server.use(cors() );
    App.server.use(cacheControl({ noCache: true }) );
    App.server.use(bodyParser() );
    App.server.use(router.routes(), router.allowedMethods() );

    return new Promise( (resolve, reject) => {

      App.server = App.server.listen(config.API.PORT, (err) => {

        if(err){

          return reject(err);

        }

        log.info('http', 'API listening', { port: config.API.PORT });
        resolve();

      });

    });

  },

  stop(){

    if(App.server){

      App.server.close();

    }

  }

};

module.exports = App;
