const EmailValidator = require('./email');
const InterfaceValidator = require('./interface');

const Validators = {
  interface: InterfaceValidator,
  email: EmailValidator
};

module.exports = Validators;
