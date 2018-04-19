const log = require('npmlog');
// const config = require('../../../config');

log.stream = process.stdout;

// log.disableColor();
// log.disableUnicode();

log.on('log.error', (logged) => {

  if(logged.messageRaw[1] && logged.messageRaw[1].error instanceof Error){

    console.error(logged.messageRaw[1].error);

  } else if(logged.messageRaw[2] && logged.messageRaw[2] instanceof Error){

    console.error(logged.messageRaw[2]);

  }

});

log.on('log', (logged) => {

  const now = new Date(Date.now() ).toISOString();

  logged.message = `[${now}] ${logged.message}`;

  if(!logged.messageRaw[1] || typeof logged.messageRaw[1] !== 'object'){

    if(typeof logged.messageRaw[1] === 'string'){

      const detail = logged.messageRaw[1];
      logged.messageRaw[1] = { detail };

    } else {

      logged.messageRaw[1] = {};

    }

  }

  logged.messageRaw[1].message = logged.messageRaw[0];
  logged.messageRaw[1].level = logged.level;
  logged.messageRaw[1].date = now;

  if(logged.level === 'error'){

    logged.message = '';
    logged.prefix = '';

  }



});


process.on('unhandledRejection', (error, promise) => {

  log.error('global', 'Unhandled rejection promise', { error, promise });

  process.exit(-1);

}).on('uncaughtException', (error) => {

  log.error('global', 'Unhandled exception', { error });

  process.exit(-1);

});
