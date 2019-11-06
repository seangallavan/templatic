'use strict';

const fs = require('fs-extra');

/**
 * Get list of applications
 *
 * @return {string[]} - list of apps
 */
module.exports.getApplicationNames = function getApplicationNames() {
  return fs.readdirSync(`${__dirname}/../yaml/applications`)
    .filter(filename => ! ['.', '..', 'defaults.yml'].includes(filename))
    .map(filename => filename.replace('.yml', ''));
};
