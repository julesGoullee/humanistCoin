const path = require('path');

const Db = require(path.join(srcDir, '/oracleApi/modules/db') );
const StateWatcher = require(path.join(srcDir, '/oracleApi/services/blockchains/stateWatcher') );

describe('Service: State watcher', () => {

  beforeEach( () => {

    this.sandbox = sandbox.create();
    this.stubDbRemoveByProp = this.sandbox.stub(Db, 'removeByProp');

  });

  afterEach( () => {

    this.sandbox.restore();

  });

  it('Should start', () => {

    expect(StateWatcher.start() ).to.be.true;
    expect(typeof StateWatcher.contract).to.exist;
    expect(typeof StateWatcher.contract.onvalidatehuman).to.eq('function');

  });

  it('Should fire on event', () => {

    expect(StateWatcher.start() ).to.be.true;
    StateWatcher.contract.onvalidatehuman('address', 'state');
    expect(this.stubDbRemoveByProp.calledWith('address', 'address') ).to.be.true;
    expect(typeof StateWatcher.contract.onvalidatehuman).to.eq('function');

  });

  it('Should stop', () => {

    expect(StateWatcher.stop() ).to.be.true;

  });

  it('Should stop and remove listener', () => {

    StateWatcher.contract = {};
    StateWatcher.contract.onvalidatehuman = 'listener';
    expect(StateWatcher.stop() ).to.be.true;

    expect(StateWatcher.contract).to.be.null;

  });

});
