const path = require('path');

const InterfaceValidator = require(path.join(srcDir, '/oracleApi/modules/validators/interface') );
const EmailValidator = require(path.join(srcDir, '/oracleApi/modules/validators/email') );
const Utils = require(path.join(srcDir, '/oracleApi/utils') );

describe('Validator: email', () => {

  beforeEach(() => {

    this.sandbox = sandbox.create();
    this.stubSend = this.sandbox.stub(Utils, 'sendMailCode').resolves(true);
    this.emailValidator = new EmailValidator();

  });

  afterEach(() => {

    this.sandbox && this.sandbox.restore();

  });

  it('Should instantiate', () => {


    expect(this.emailValidator.db).to.exist;

  });

  it('Should send', async () => {

    const res = await this.emailValidator.submission('id', { content: { email: 'email@email.com' } });
    expect(res).to.eq('email@email.com');
    expect(this.stubSend.args[0][0]).to.eq('email@email.com');
    expect(this.emailValidator.db[this.stubSend.args[0][1]].id).to.eq('id');

  });

  it('Cannot do nothing if callback code not found', async () => {

    const res = this.emailValidator.callback({ code: 'not-exist-code' });

    expect(res).to.be.false;

  });

  it('Should call callback and return state validate', async () => {

    await this.emailValidator.submission('id', { content: { email: 'email@email.com' } });
    const code = this.stubSend.args[0][1];

    const res = await this.emailValidator.callback({ code });
    expect(res.id).to.eq('id');
    expect(res.state).to.eq(InterfaceValidator.STATES().CONFIRMED);

  });

});