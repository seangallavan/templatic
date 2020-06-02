#!/usr/bin/env node
'use strict';

const yargs = require('yargs');
const path = require('path');

const yargsUtil = require('./lib/yargs');

yargsUtil.demandCommand(yargs, path.join(__dirname, './commands'))
  .argv;
