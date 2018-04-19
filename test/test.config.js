const path = require('path');
const chaiAsPromised = require('chai-as-promised');

global.srcDir = path.resolve(path.join(__dirname, '../src') );

require(path.join(srcDir, '/oracleApi/modules/logger') );

global.chai = require('chai');
global.expect = global.chai.expect;
global.chai.use(chaiAsPromised);
global.sandbox = require('sinon').sandbox;

