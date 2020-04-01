'use strict';

const path = require('path');

const yargsUtil = require('../lib/yargs');

exports.command = 'generate';

exports.desc = 'Generate related commands';

exports.builder = yargs => {
  yargsUtil.demandCommand(yargs, path.join(__dirname, './generateCommands'));
};
