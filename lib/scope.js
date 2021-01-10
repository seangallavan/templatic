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

module.exports.validateScope = function validateScope(argv, outputDirectoryHierarchy) {
  if(argv.appNames && !outputDirectoryHierarchy.includes('application')) {
    console.log('Unable to process a template group which requires all applications when specifying a list');
    process.exit(1);
  }

  if(argv.envNames && !outputDirectoryHierarchy.includes('environment')) {
    console.log('Unable to process a template group which requires all environments when specifying a list');
    process.exit(1);
  }

  if(argv.containerNames && !outputDirectoryHierarchy.includes('containers')) {
    console.log('Unable to process a template group which requires all containers when specifying a list');
    process.exit(1);
  }
}