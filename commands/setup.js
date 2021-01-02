'use strict';

const fs = require('fs-extra');

const data = require('../lib/data');

exports.command = 'setup [-d dataDir]';

exports.desc = 'Create a new directory structure';

exports.builder = {
  dataDir: {
    alias: 'd'
  },
};

exports.handler = argv => {
    data.setDataPath(argv.dataDir ? argv.dataDir : process.cwd());
    fs.ensureDirSync(`${data.getDataPath()}/input/applications`);
    fs.ensureDirSync(`${data.getDataPath()}/input/environments`);
    fs.ensureDirSync(`${data.getDataPath()}/input/containers`);
    fs.ensureDirSync(`${data.getDataPath()}/input/templates`);
    fs.ensureFileSync(`${data.getDataPath()}/input/globals.yml`);
    fs.ensureDirSync(`${data.getDataPath()}/output`);
    //Readme
};
