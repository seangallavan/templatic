'use strict';
const fs = require('fs-extra');

const data = require('../lib/data');

exports.command = 'create <resourceType> <resourceName> [-d dataDir]';

exports.desc = 'Create a resource';

exports.builder = {
  resourceType: {
    type: 'string',
    requiresArg: true,
  },
  resourceName: {
    type: 'string',
    requiresArg: true,
  },
  dataDir: {
    alias: 'd'
  },
};

exports.handler = argv => {
  data.setDataPath(argv.dataDir ? argv.dataDir : process.cwd());
  
  if(argv.resourceType === 'template') {
    const paerts = ar
  }

  fs.outputFileSync(`${data.getDataPath()}/input/${argv.resourceType}s/${argv.resourceName}.yml`, `---\nname: ${argv.resourceName}\n\n`);
};
