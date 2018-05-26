require('../modules/logger');
const log = require('npmlog');
const App = require('./api/app');
const StatusWatcher = require('./blockchains/statusWatcher');

(async () => {

  await StatusWatcher.start();
  await App.start();

})().catch(error => log.error('global', 'Error on started', { error }) );
