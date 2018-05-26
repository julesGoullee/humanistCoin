const path = require('path');

const Validator = require(path.join(srcDir, '/oracleApi/modules/validators/interface') );

describe('Validator interface', () => {

  beforeEach(() => {

    this.sandbox = createSandbox();

  });

  afterEach(() => {

    this.sandbox && this.sandbox.restore();

  });

  it('Should throw error for non implemented methods', async () => {

    const validator = new Validator();
    const methodsAsync = ['submission'];
    const methodsSync = ['callback'];
    const methodsStaticSync = [ 'schemaValidation', 'schemaCallbackValidation'];

    await Promise.all(methodsAsync.map(async method => await expect(validator[method]())
      .to.be.rejectedWith(Error, 'not_implemented')));
    expect(Validator.STATUS).to.exist;
    methodsSync.forEach(method => expect(validator[method]).to.throw(Error, 'not_implemented'));
    methodsStaticSync.forEach(method => expect(Validator[method]).to.throw(Error, 'not_implemented'));

  });

});