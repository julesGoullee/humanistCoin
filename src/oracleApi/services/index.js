require('../modules/logger');
const log = require('npmlog');
const App = require('./api/app');
const StateWatcher = require('./blockchains/stateWatcher');

(async () => {

  await StateWatcher.start();
  await App.start();

})().catch(error => log.error('global', 'Error on started', { error }) );
