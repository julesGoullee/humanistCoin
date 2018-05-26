const path = require('path');

const Db = require(path.join(srcDir, '/oracleApi/modules/db') );
const Errors = require(path.join(srcDir, '/utils/errors') );

describe('Db', () => {

  beforeEach( () => {

    this.sandbox = createSandbox();

  });

  afterEach( () => {

    Db.clear();
    this.sandbox.restore();

  });

  it('Should add and get', () => {

    Db.add('id', 'content');
    expect(Object.entries(Db.storage).length).to.eq(1);

  });

  it('Should add and get', () => {

    Db.add('id', 'content');
    expect(Db.get('id') ).to.eq('content');

  });

  it('Should remove by prop', () => {

    Db.add('id', {  prop: 'content' });
    expect(Db.removeByProp('prop', 'content') ).to.be.true;
    expect(Object.entries(Db.storage).length).to.eq(0);
    expect(Db.get('id') ).to.be.undefined;

  });

  it('Cannot remove unknown entry', () => {

    const stubError = this.sandbox.stub(Errors, 'throwError');
    Db.removeByProp('prop', 'content');

    expect(stubError.calledOnce).to.be.true;

  });

  it('Cannot remove not found entry', () => {

    Db.add('id', {  prop: 'content' });
    expect(() => Db.removeByProp('prop', 'content1') ).to.throw(Error, 'entry_not_found');

  });

  it('Should clear', () => {

    Db.add('id', {  prop: 'content' });

    Db.clear();
    expect(Object.entries(Db.storage).length).to.eq(0);

  });

});
