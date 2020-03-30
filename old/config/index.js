'use strict';

const yaml = require('js-yaml');
const nconf = require('nconf/lib/nconf');
const fs = require('fs');

const config = yaml.safeLoad(fs.readFileSync(`${__dirname}/config.yml`, {encoding: 'utf8'}));

let nconfInstance = nconf
  .use('memory')
  .argv()
  .overrides(config);

module.exports = nconfInstance;
