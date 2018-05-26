const path = require('path');

const ValidatorController = require(path.join(srcDir, '/oracleApi/services/api/controllers/validate') );
const Db = require(path.join(srcDir, '/oracleApi/modules/db') );

describe('Controller: validate', () => {

  beforeEach( () => {

    this.sandbox = createSandbox();
    this.stubValidatorSend = this.sandbox.stub(ValidatorController.validator, 'submission');
    this.stubValidatorCallback = this.sandbox.stub(ValidatorController.validator, 'callback');
    this.stubDbAdd = this.sandbox.stub(Db, 'add');
    this.stubDbGet = this.sandbox.stub(Db, 'get');

  });

  afterEach( () => {

    this.sandbox && this.sandbox.restore();

  });

  it('Should send submission', async () => {

    this.stubValidatorSend.resolves('hash');
    const params = {
      address: 'address',
      content: 'content'
    };
    const res = await ValidatorController.submission(params);
    const id = this.stubValidatorSend.args[0][0];
    expect(id).to.be.a.string;

    expect(res).to.deep.eq({
      id,
      address: 'address',
      status: ValidatorController.Validator.STATUS().PENDING,
      hash: 'hash',
      contractValue: `${ValidatorController.Validator.STATUS().PENDING}:hash`
    });

    expect(this.stubValidatorSend.args[0][1]).to.deep.eq(params);

    expect(this.stubDbAdd.calledOnce).to.be.true;

    expect(this.stubDbAdd.args[0][1].content).to.eq('content');
    expect(this.stubDbAdd.args[0][1].address).to.eq('address');
    expect(this.stubDbAdd.args[0][1].id).to.eq(id);
    expect(this.stubDbAdd.args[0][1].hash).to.eq('hash');
    expect(this.stubDbAdd.args[0][1].status).to.eq(ValidatorController.Validator.STATUS().PENDING);
    expect(this.stubDbAdd.args[0][1].contractValue).to.eq(`${this.stubDbAdd.args[0][1].status}:hash`);

  });

  it('Cannot get status with unknown id', () => {

    const id = 'not-existing-id';
    expect(() => ValidatorController.status(id) ).to.be.throw('unknown_id');
    expect(this.stubDbGet.calledWith(id) ).to.be.true;

  });

  it('Should get status', () => {

    this.stubDbGet.returns({ id: 'id '});

    expect(ValidatorController.status('id') ).to.deep.eq({ id: 'id '});
    expect(this.stubDbGet.calledWith('id') ).to.be.true;

  });

  it('Should validateCallback', () => {

    const stubSubmission = {
      status:  ValidatorController.Validator.STATUS().PENDING,
      hash: 'hash'
    };
    this.stubDbGet.returns(stubSubmission);
    this.stubValidatorCallback.returns({
      status: ValidatorController.Validator.STATUS().CONFIRMED,
      id: 'id'
    });
    const resCallback = ValidatorController.callback('id');
    expect(resCallback).to.be.deep.eq(stubSubmission);

    expect(this.stubValidatorCallback.calledWith('id') ).to.be.true;
    expect(this.stubDbGet.calledWith('id') ).to.be.true;

    expect(stubSubmission.status).to.eq(ValidatorController.Validator.STATUS().CONFIRMED);
    expect(stubSubmission.contractValue).to.eq(`${stubSubmission.status}:hash`);

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

  it('Should do nothing if validateCallback status is same', () => {

    const stubSubmission = {
      status:  ValidatorController.Validator.STATUS().PENDING,
      hash: 'hash',
      contractValue: 'contractValue'
    };

    this.stubValidatorCallback.returns({
      status: ValidatorController.Validator.STATUS().PENDING,
      id: 'id'
    });

    this.stubDbGet.returns(stubSubmission);

    const res = ValidatorController.callback('id');
    expect(stubSubmission.status).to.eq(ValidatorController.Validator.STATUS().PENDING);
    expect(stubSubmission.contractValue).to.eq('contractValue');
    expect(res).to.be.deep.eq(stubSubmission);

  });

  it('Should filter submission', () => {

    const submission = {
      content: 'content',
      id: 'id'
    };
    const res = ValidatorController._filterSubmission(submission);
    expect(res.id).to.eq(submission.id);
    expect(submission.content).to.exist;
    expect(res.content).not.to.exist;

  });

});