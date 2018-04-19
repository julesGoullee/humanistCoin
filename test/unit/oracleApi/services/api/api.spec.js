const path = require('path');

const config = require(path.join(srcDir, '/oracleApi/config') );
const Utils = require(path.join(srcDir, '/oracleApi/utils') );
const App = require(path.join(srcDir, '/oracleApi/services/api/app') );
const apiClient = require(path.join(srcDir, '/apiClient') );
const InterfaceValidator = require(path.join(srcDir, '/oracleApi/modules/validators/interface') );
const Db = require(path.join(srcDir, '/oracleApi/modules/db') );

describe('Api oracle', () => {

  beforeEach(async () => {

    this.sandbox = sandbox.create();

    this.stubSend = this.sandbox.stub(Utils, 'sendMailCode').resolves(true);
    await App.start();

  });

  afterEach( () => {

    App.stop();
    Db.clear();
    this.sandbox.restore();

  });

  it('Should get info', async () => {

    const info = await apiClient.info();

    expect(info.contractAddress).to.be.eq(config.CONTRACT_ADDRESS);

  });

  it('Should submit email', async () => {

    const id = await apiClient.submission({
      birthday: 0,
      email: 'email@email.com',
    }, 'address');

    expect(id).to.be.a.string;
    const code = this.stubSend.args[0][1];

    const resStatusBefore = await apiClient.status(id);
    expect(resStatusBefore.state).to.eq(InterfaceValidator.STATES().PENDING);

    const resCallback = await apiClient.callbackEmail(code);
    expect(resCallback).to.be.true;

    const resStatus = await apiClient.status(id);
    expect(resStatus.state).to.eq(InterfaceValidator.STATES().CONFIRMED);
    expect(resStatus.contractValue).to.eq(`${resStatus.state}:${resStatus.hash}`);

  });

});
