const ngrok = require('ngrok');
const config = require('../src/config');

const Tunnel = {

  async start(){

    const url = await ngrok.connect(config.API.PORT);

    return url;

  },

  async stop(){

    await ngrok.disconnect();
    await ngrok.kill();

  }

};

module.exports = Tunnel;

