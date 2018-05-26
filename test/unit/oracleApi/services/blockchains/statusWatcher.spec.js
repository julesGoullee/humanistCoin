const path = require('path');

const Db = require(path.join(srcDir, '/oracleApi/modules/db') );
const StatusWatcher = require(path.join(srcDir, '/oracleApi/services/blockchains/statusWatcher') );

describe('Service: Status watcher', () => {

  beforeEach( () => {

    this.sandbox = createSandbox();
    this.stubDbRemoveByProp = this.sandbox.stub(Db, 'removeByProp');

  });

  afterEach( () => {

    this.sandbox.restore();

  });

  it('Should start', () => {

    expect(StatusWatcher.start() ).to.be.true;
    expect(typeof StatusWatcher.contract).to.exist;
    expect(typeof StatusWatcher.contract.onvalidatehuman).to.eq('function');

  });

  it('Should fire on event', () => {

    expect(StatusWatcher.start() ).to.be.true;
    StatusWatcher.contract.onvalidatehuman('address', 'state');
    expect(this.stubDbRemoveByProp.calledWith('address', 'address') ).to.be.true;
    expect(typeof StatusWatcher.contract.onvalidatehuman).to.eq('function');

  });

  it('Should stop', () => {

    expect(StatusWatcher.stop() ).to.be.true;

  });

  it('Should stop and remove listener', () => {

    StatusWatcher.contract = {};
    StatusWatcher.contract.onvalidatehuman = 'listener';
    expect(StatusWatcher.stop() ).to.be.true;

    expect(StatusWatcher.contract).to.be.null;

  });

});
