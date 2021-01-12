'use strict';

const path = require('path');
const glob = require('glob');
const fs = require('fs-extra');

const data = require('./data');

/**
 * Returns the scope object
 *
 * @param {object} argv - arguments for the command
 * @returns {{templateGroups: (string[]), templateNames: (string[]|undefined), environments: (string[]), containers: (*|string[]), applications: (string[])}} - scope
 */
module.exports.getScope = function getScope(argv) {
  const templatePaths = argv.templatePaths.split(',');
  const templates = [];

  templatePaths.forEach(templatePath => {
    glob.sync(path.normalize(`${data.getDataPath()}/input/templates/${templatePath}`))
      .filter(template => path.basename(template) !== 'metadata.yml')
      .filter(template => !fs.lstatSync(template).isDirectory())
      .map(template => path.relative(`${data.getDataPath()}/input/templates`, template))
      .forEach(template => templates.push(template));
  });


  return {
    applications: argv.appNames ? argv.appNames.split(',') : data.getResourceNames('application'),
    environments: argv.envNames ? argv.envNames.split(',') : data.getResourceNames('environment'),
    containers: argv.containerNames ? argv.containerNames.split(',') : data.getResourceNames('container'),
    templates: templates
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