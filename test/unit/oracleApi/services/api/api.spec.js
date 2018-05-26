const path = require('path');
const moment = require('moment');

const config = require(path.join(srcDir, '/config') );
const App = require(path.join(srcDir, '/oracleApi/services/api/app') );
const apiClient = require(path.join(srcDir, '/apiClient') );
const InterfaceValidator = require(path.join(srcDir, '/oracleApi/modules/validators/interface') );
const Db = require(path.join(srcDir, '/oracleApi/modules/db') );

describe('Api oracle', () => {

  beforeEach(async () => {

    this.sandbox = createSandbox();

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

    const resSubmit = await apiClient.submission({
      birthday: moment().format(),
      email: 'email@email.com',
    }, 'address');

    expect(resSubmit.id).to.be.a.string;

    const resStatusBefore = await apiClient.status(resSubmit.id);
    expect(resStatusBefore.status).to.eq(InterfaceValidator.STATUS().PENDING);

    const resCallback = await apiClient.callbackEmail('00000000-0000-0000-0000-000000000000');
    expect(resCallback).to.deep.eq({
      id: resSubmit.id,
      contractValue: `${InterfaceValidator.STATUS().CONFIRMED}:email@email.com`,
      address: 'address',
      hash: 'email@email.com',
      status: InterfaceValidator.STATUS().CONFIRMED
    });

    const resStatus = await apiClient.status(resSubmit.id);
    expect(resStatus).to.deep.eq({
      id: resSubmit.id,
      contractValue: `${InterfaceValidator.STATUS().CONFIRMED}:email@email.com`,
      address: 'address',
      hash: 'email@email.com',
      status: InterfaceValidator.STATUS().CONFIRMED
    });

  });

});
