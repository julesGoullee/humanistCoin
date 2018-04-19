const path = require('path');

const ValidatorController = require(path.join(srcDir, '/oracleApi/services/api/controllers/validate') );
const Db = require(path.join(srcDir, '/oracleApi/modules/db') );

describe('Controller: validate', () => {

  beforeEach( () => {

    this.sandbox = sandbox.create();
    this.stubValidatorSend = this.sandbox.stub(ValidatorController.validator, 'submission');
    this.stubValidatorCallback = this.sandbox.stub(ValidatorController.validator, 'callback');
    this.stubDbAdd = this.sandbox.stub(Db, 'add');
    this.stubDbGet = this.sandbox.stub(Db, 'get');

  });

  afterEach( () => {

    this.sandbox && this.sandbox.restore();

  });

  it('Should send submission', async () => {

    this.stubValidatorSend.resolves(true);
    const params = {
      address: 'address'
    };
    const res = await ValidatorController.submission(params);
    const id = this.stubValidatorSend.args[0][0];
    expect(id).to.be.a.string;
    expect(res).to.eq(id);
    expect(this.stubValidatorSend.args[0][1]).to.deep.eq(params);

    expect(this.stubDbAdd.calledOnce).to.be.true;

    expect(this.stubDbAdd.args[0][1]).to.exist;
    expect(this.stubDbAdd.args[0][1].data).to.exist;
    expect(this.stubDbAdd.args[0][1].address).to.exist;
    expect(this.stubDbAdd.args[0][1].id).to.eq(res);
    expect(this.stubDbAdd.args[0][1].hash).to.eq(true);
    expect(this.stubDbAdd.args[0][1].state).to.eq(ValidatorController.Validator.STATES().PENDING);
    expect(this.stubDbAdd.args[0][1].contractValue).to.exist;
    expect(this.stubDbAdd.args[0][1].contractValue).to.eq(`${this.stubDbAdd.args[0][1].state}:true`);

  });

  it('Cannot get status with unknown id', () => {

    const id = 'not-existing-id';
    expect(() => ValidatorController.status(id) ).to.be.throw('unknown_id');
    expect(this.stubDbGet.calledWith(id) ).to.be.true;

  });

  it('Should get status', () => {

    this.stubValidatorSend.resolves(true);
    this.stubDbGet.returns('content');

    expect(ValidatorController.status('id') ).to.eq('content');
    expect(this.stubDbGet.calledWith('id') ).to.be.true;

  });

  it('Should validateCallback', () => {

    const stubSubmission = {
      state:  ValidatorController.Validator.STATES().PENDING,
      hash: 'hash'
    };
    this.stubDbGet.returns(stubSubmission);
    this.stubValidatorCallback.returns({
      state: ValidatorController.Validator.STATES().CONFIRMED,
      id: 'id'
    });
    const resCallback = ValidatorController.callback('id');
    expect(resCallback).to.be.true;

    expect(this.stubValidatorCallback.calledWith('id') ).to.be.true;
    expect(this.stubDbGet.calledWith('id') ).to.be.true;

    expect(stubSubmission.state).to.eq(ValidatorController.Validator.STATES().CONFIRMED);
    expect(stubSubmission.contractValue).to.eq(`${stubSubmission.state}:hash`);

  });

  it('Cannot validateCallback if not found callback id', () => {

    this.stubValidatorCallback.returns(null);
    expect( () => ValidatorController.callback('id') ).to.throw(Error, 'unknown_callback_id');

  });

  it('Cannot validateCallback if not found callback id', () => {

    this.stubValidatorCallback.returns(true);
    this.stubDbGet.returns(null);

    expect( () => ValidatorController.callback('id') ).to.throw(Error, 'unknown_id');

  });

  it('Should do nothing if validateCallback state is same', () => {

    const stubSubmission = {
      state:  ValidatorController.Validator.STATES().PENDING,
      hash: 'hash',
      contractValue: 'contractValue'
    };

    this.stubValidatorCallback.returns({
      state: ValidatorController.Validator.STATES().PENDING,
      id: 'id'
    });

    this.stubDbGet.returns(stubSubmission);

    const res = ValidatorController.callback('id');
    expect(stubSubmission.state).to.eq(ValidatorController.Validator.STATES().PENDING);
    expect(stubSubmission.contractValue).to.eq('contractValue');
    expect(res).to.be.true;

  });

});