'use strict';

const data = require('./data');

/**
 * Returns the scope object
 *
 * @param {object} argv - arguments for the command
 * @returns {{templateGroups: (string[]), templateNames: (string[]|undefined), environments: (string[]), containers: (*|string[]), applications: (string[])}} - scope
 */
module.exports.getScope = function getScope(argv) {
  return {
    applications: argv.appNames ? argv.appNames.split(',') : data.getResourceNames('application'),
    environments: argv.envNames ? argv.envNames.split(',') : data.getResourceNames('environment'),
    templateGroups: argv.templateGroups ? argv.templateGroups.split(',') : data.getTemplateGroupNames(),
    containers: argv.containerNames ? argv.containerNames.split(',') : data.getResourceNames('container'),
    templateNames: argv.templateNames ? argv.templateNames.split(',') : undefined,
  }
}
