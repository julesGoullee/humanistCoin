const path = require('path');

const config = require(path.join(srcDir, '/oracleApi/config') );
const InterfaceValidator = require(path.join(srcDir, '/oracleApi/modules/validators/interface') );
const EmailValidator = require(path.join(srcDir, '/oracleApi/modules/validators/email') );
const Utils = require(path.join(srcDir, '/oracleApi/utils') );

describe('Validator: email', () => {

  beforeEach(() => {

    this.sandbox = createSandbox();
    this.emailValidator = new EmailValidator();

  });

  afterEach(() => {

    this.sandbox && this.sandbox.restore();

  });

  it('Should instantiate', () => {


    expect(this.emailValidator.db).to.exist;

  });

  it('Should submit without mail key', async () => {

    const res = await this.emailValidator.submission('id', { content: { email: 'email@email.com' } });
    expect(res).to.eq('email@email.com');
    expect(this.emailValidator.db['00000000-0000-0000-0000-000000000000'].id).to.eq('id');

  });

  describe('With email key', () => {

    beforeEach( () => {

      this.oldSendgridApiKey = config.SENDGRID_API_KEY;
      config.SENDGRID_API_KEY = 'SENDGRID_API_KEY';
      this.stubSendMailCode = this.sandbox.stub(Utils, 'sendMailCode').resolves(true);

    });

    afterEach( () => {

      config.SENDGRID_API_KEY = this.oldSendgridApiKey;

    });

    it('Should submit with mail key', async () => {

      const res = await this.emailValidator.submission('id', { content: { email: 'email@email.com' } });
      expect(res).to.eq('email@email.com');
      expect(this.stubSendMailCode.args[0][0]).to.eq('email@email.com');
      expect(this.emailValidator.db[this.stubSendMailCode.args[0][1]].id).to.eq('id');

    });

  });

  it('Cannot do nothing if callback code not found', async () => {

    const res = this.emailValidator.callback({ code: 'not-exist-code' });

    expect(res).to.be.false;

  });

  it('Should call callback and return status validate', async () => {

    await this.emailValidator.submission('id', { content: { email: 'email@email.com' } });

    const res = await this.emailValidator.callback({ code: '00000000-0000-0000-0000-000000000000' });
    expect(res.id).to.eq('id');
    expect(res.status).to.eq(InterfaceValidator.STATUS().CONFIRMED);
    expect(this.emailValidator.db['00000000-0000-0000-0000-000000000000']).to.be.undefined;

  });

});