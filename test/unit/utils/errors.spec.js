const path = require('path');
const Errors = require(path.join(srcDir, '/utils/errors') );

describe('Errors', () => {

  beforeEach(async () => {

    this.sandbox = createSandbox();

  });

  afterEach(async () => {

    this.sandbox.restore();

  });

  it('Should display error', () => {

    const error = new Error('Errors');

    expect(Errors.displayError(error) ).to.eq('Unknown error');

  });

  it('Should display expose custom error', () => {

    const error = new Error('bad_params');
    error.isCustom = true;
    error.expose = true;
    error.meta = { params: '1'};
    expect(Errors.displayError(error) ).to.eq('Bad parameters params: "1"');

  });

  it('Should display expose custom error with meta array', () => {

    const error = new Error('bad_params');
    error.isCustom = true;
    error.expose = true;
    error.meta = ['error1', 'error2'];
    expect(Errors.displayError(error) ).to.eq('Bad parameters: error1 error2');

  });

  it('Should display expose custom unknown_error', () => {

    const error = new Error('one_error');
    error.isCustom = true;
    error.expose = true;
    error.meta = { params: '1'};
    expect(Errors.displayError(error) ).to.eq('Unknown error');

  });

});