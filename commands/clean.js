'use strict';

const fs = require('fs-extra');

const data = require('../lib/data');

exports.command = 'clean [-d dataDir]';

exports.desc = 'Remove and recreate output directory';

exports.builder = {
  dataDir: {
    alias: 'd'
  },
};

exports.handler = argv => {
  data.setDataPath(argv.dataDir ? argv.dataDir : process.cwd());

  fs.removeSync(`${data.getDataPath()}/output`);
  fs.ensureDirSync(`${data.getDataPath()}/output`);
};
