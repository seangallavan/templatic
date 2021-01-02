'use strict';

const yargs = require('yargs');
const path = require('path');

const yargsUtil = require('./lib/yargs');
const data = require('./lib/data');

module.exports.run = function run(argv) {
  data.setDataPath(argv[1].replace(/\/cli.js$/, ''));

  yargsUtil.demandCommand(yargs.parse(argv), path.join(__dirname, './commands'))
    .argv;
};