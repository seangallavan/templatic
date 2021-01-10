'use strict';
const fs = require('fs-extra');
const path = require('path');

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
  const resourceName = argv.resourceName;
  const resourceType = argv.resourceType;

  if(resourceType === 'template') {
    const templateParts = resourceName.split('/');

    fs.outputFileSync(`${data.getDataPath()}/input/${resourceType}s/${resourceName}`, '');
    if(!fs.existsSync(`${data.getDataPath()}/input/${resourceType}s/${templateParts[0]}/metadata.yml`)) {
      fs.outputFileSync(`${data.getDataPath()}/input/${resourceType}s/${templateParts[0]}/metadata.yml`, `---
#outputDirectoryHierarchy:
# Can consist of any order of: application, environment, container
#  - application #top level
#  - environment #second level
`);
    }
  } else {
    fs.outputFileSync(`${data.getDataPath()}/input/${resourceType}s/${resourceName}.yml`, `---\nname: ${resourceName}\n\n`);
  }

};
