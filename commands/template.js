'use strict';

const fs = require('fs-extra');
const data = require('../lib/data');

exports.command = 'template <templateGroup> <templateName>';

exports.desc = 'Create a new template and template group if necessary';

exports.builder = {
  templateGroup: {
    type: 'string',
    requiresArg: true,
  },
  templateName: {
    type: 'string',
    requiresArg: true,
  },
};

exports.handler = argv => {
  data.setDataPath(argv.dataDir ? argv.dataDir : process.cwd());

  fs.ensureFileSync(`${data.getDataPath()}/input/templates/${argv.templateGroup}/${argv.templateName}`);
  fs.ensureFileSync(`${data.getDataPath()}/input/templates/${argv.templateGroup}/metadata.yml`);
};
