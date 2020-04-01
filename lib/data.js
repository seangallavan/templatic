'use strict';

const fs = require('fs-extra');

const config = require('../config');

/**
 * Get list of applications
 *
 * @return {string[]} - list of apps
 */
module.exports.getApplicationNames = function getApplicationNames() {
  return getFilesBasename(`${config.get('dataRepo:path')}/input/applications`);
};

/**
 * Get list of environments
 *
 * @return {string[]} - list of environments
 */
module.exports.getEnvironmentNames = function getEnvironmentNames() {
  return getFilesBasename(`${config.get('dataRepo:path')}/input/environments`);
};

/**
 * Get list of template types
 *
 * @return {string[]} - list of template types
 */
module.exports.getTemplateTypes = function getTemplateTypes() {
  return ['global', 'application', 'environment'];
};

/**
 * Get list of template groups
 *
 * @param {string} templateType - template type (application|environment|global)
 * @return {string[]} - list of template groups
 */
module.exports.getTemplateGroupNames = function getTemplateGroupNamestemplateType(templateType) {
  return getFilesBasename(`${config.get('dataRepo:path')}/input/templates/${templateType}`);
};

/**
 * Get list of template names in a template group
 *
 * @param {string} templateType - template type (application|environment|global)
 * @param {string} templateGroup - the template group
 * @return {string[]} - list of template groups
 */
module.exports.getTemplateNamesInGroup = function getTemplateNamesInGroup(templateType, templateGroup) {
  return getFiles(`${config.get('dataRepo:path')}/input/templates/${templateType}/${templateGroup}`);
};

/**
 * Get list of rendered template names
 *
 * @param {string} templateType - template type (application|environment|global)
 * @param {string} templateGroup - the template group
 * @return {string[]} - list of rendered template names
 */
module.exports.getRenderedTemplateNamesInGroup = function getRenderedTemplateNamesInGroup(templateType, templateGroup) {
  return getFiles(`${config.get('dataRepo:path')}/input/templatess/${templateType}/${templateGroup}`)
    .map(file => {
      return file.replace(/.j2$/, '');
    });
};

/**
 * Save a rendered template
 *
 * @param {string} appName - the application name
 * @param {string} templateType - template type (application|environment|global)
 * @param {string} templateGroup - the directory for the template
 * @param {string} templateFilename - the filename of the template
 * @param {string} environment - the environment
 * @param {string} renderedText - the rendered text
 */
module.exports.saveRenderedTemplate = function saveRenderedTemplate(appName, templateType, templateGroup, templateFilename, environment, renderedText) {
  const newTemplateFilename = templateFilename.replace(/.j2$/, '');

  switch(templateType) {
    case 'global':
      fs.ensureDirSync(`${config.get('dataRepo:path')}/output/global/${templateGroup}/${environment}`);
      fs.writeFileSync(`${config.get('dataRepo:path')}/output/global/${templateGroup}/${environment}/${newTemplateFilename}`, renderedText);
      break;
    case 'application':
      if(!environment) {
        fs.ensureDirSync(`${config.get('dataRepo:path')}/output/applications/${appName}/global/${templateGroup}`);
        fs.writeFileSync(`${config.get('dataRepo:path')}/output/applications/${appName}/global/${templateGroup}/${newTemplateFilename}`, renderedText);
      } else {
        fs.ensureDirSync(`${config.get('dataRepo:path')}/output/applications/${appName}/${environment}/${templateGroup}`);
        fs.writeFileSync(`${config.get('dataRepo:path')}/output/applications/${appName}/${environment}/${templateGroup}/${newTemplateFilename}`, renderedText);
      }
      break;
    case 'environment':
      fs.ensureDirSync(`${config.get('dataRepo:path')}/output/applications/${appName}/${environment}/${templateGroup}`);
      fs.writeFileSync(`${config.get('dataRepo:path')}/output/applications/${appName}/${environment}/${templateGroup}/${newTemplateFilename}`, renderedText);
      break;
  }
};

/**
 * Get an array of base filenames (filenames without the .yml suffix)
 *
 * @param {string} dir - the directory
 * @returns {string[]} - the base filenames
 */
function getFilesBasename(dir) {
  return getFiles(dir)
    .map(filename => filename.replace(/.yml$/, ''));
}

/**
 * Get an array of filenames (excluding . and ..)
 *
 * @param {string} dir - the directory
 * @returns {string[]} - the base filenames
 */
function getFiles(dir) {
  return fs.readdirSync(dir)
    .filter(filename => ! ['.', '..'].includes(filename));
}