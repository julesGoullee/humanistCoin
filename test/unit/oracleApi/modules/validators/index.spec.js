const path = require('path');

const Validators = require(path.join(srcDir, '/oracleApi/modules/validators') );

describe('Validators', () => {

  beforeEach( () => {

    this.sandbox = createSandbox();

  });

  afterEach( () => {

    this.sandbox.restore();

  });

  it('Should create validator', async () => {

    expect(Validators.interface).to.exist;
    expect(Validators.email).to.exist;

  });

});