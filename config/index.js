'use strict';

const nconf = require('nconf');

const env = process.env.NODE_ENV || 'local';
const config = require(`${__dirname}/defaults.js`);

let nconfInstance = nconf
  .argv()
  .overrides(envConfig)
  .defaults(defaultConfig);

module.exports = nconfInstance;
