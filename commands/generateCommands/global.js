'use strict';

const { execSync } = require('child_process');

exports.command = 'global [-g templateGroup]';

exports.desc = 'Generate global templates';

exports.builder = {};

exports.handler = argv => {
  execSync(`docker build --no-cache -f ${argv.dockerfilePath} -t ${argv.name}:${argv.tag} .`);

  console.log('build succeeded!');
};
