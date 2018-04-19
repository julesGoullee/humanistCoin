const spawn = require('child_process').spawn;

class OraclizeBridge {

  constructor(){

    this.child = false;
    this.bridgeDir = 'ethereum-bridge';
    this.params = [
      'bridge',
      '-a',
      '0',
      '--dev'];

  }

  async start(){

    if(this.child){

      return false;

    }

    this.child = spawn('node', this.params, { cwd: this.bridgeDir });

    return new Promise( (resolve, reject) => {

      this.child.stdout.on('data', (data) => {

        const log = data.toString();
        console.log(`[OraclizeBridge]\n${log}`);

        if(log.includes('OAR = OraclizeAddrResolverI(') ){

          const [,address,] = /.*\((.*)\)/.exec(log);
          resolve(address);

        }

      });

      this.child.stderr.on('data', (data) => {

        console.error(`[OraclizeBridge] error:\n${data.toString()}`);
        reject(new Error(data.toString() ) );

      });

    });

  }

  async stop(){

    if(!this.child){

      return false;

    }

    this.child.stdin.write('"\x03"');
    this.child.kill('SIGINT');

    return new Promise (resolve => {

      this.child.on('close', () => {

        console.info('[OraclizeBridge] closed');

        resolve();

      });

    });

  }

}

module.exports = OraclizeBridge;
