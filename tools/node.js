const ganache = require('ganache-core');
const defaults = require('lodash/defaults');

process.on('unhandledRejection', (err) => {
  throw err;
});

const log = console.log.bind(console, '[Ethereum Node]');

class Node {

  constructor(opts){

    this.opts = defaults(opts, {
      port: 8545,
      network_id: 42
    });
    this.server = ganache.server(this.opts);

  }

  start(){

    return new Promise( (resolve, reject) => {

      this.server.listen(this.opts.port, (err) => {

        if(err){

          return reject(err);

        }

        log('Node start');
        log('accounts', this.opts.accounts);

        resolve();

      });

    });

  }

  stop(){

    this.server.close();
    log('Node stop');

  }

}

module.exports = Node;
