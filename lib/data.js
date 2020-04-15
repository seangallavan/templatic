'use strict';

const _ = require('lodash');
const fs = require('fs-extra');
const yaml = require('js-yaml');
const {execSync} = require('child_process');

let dataPath;

/**
 * Set the path to the data directory
 *
 * @param {string} path - the path
 */
module.exports.setDataPath = function setDataPath(path) {
  dataPath = path;
};

/**
 * Get the path to the data directory
 *
 * @returns {string} - the path
 */
module.exports.getDataPath = function getDataPath() {
  return dataPath;
};

/**
 * Get list of input types
 *
 * @return {string[]} - input types
 */
module.exports.getInputTypes = function getInputTypes() {
  return ['application', 'container', 'environment'];
};

/**
 * Get list of applications
 *
 * @return {string[]} - list of apps
 */
module.exports.getApplicationNames = function getApplicationNames() {
  return getFilesBasename(`${dataPath}/input/applications`);
};

/**
 * Get list of environments
 *
 * @return {string[]} - list of environments
 */
module.exports.getEnvironmentNames = function getEnvironmentNames() {
  return getFilesBasename(`${dataPath}/input/environments`);
};

/**
 * Get list of container names
 *
 * @return {string[]} - list of container names
 */
module.exports.getContainerNames = function getContainerNames() {
  return getFiles(`${dataPath}/input/containers`)
    .map(filename => {
      return filename.replace(/.yml.j2$/, '');
    });
};

/**
 * Get list of template groups
 *
 * @return {string[]} - list of template groups
 */
module.exports.getTemplateGroupNames = function getTemplateGroupNames() {
  return getFilesBasename(`${dataPath}/input/templates`);
};

/**
 * Get list of template names in a template group
 *
 * @param {string} templateGroup - the template group
 * @return {string[]} - list of template groups
 */
module.exports.getTemplateNamesInGroup = function getTemplateNamesInGroup(templateGroup) {
  return getFiles(`${dataPath}/input/templates/${templateGroup}`).filter(file => file !== 'metadata.yml');
};

/**
 * Get list of rendered template names
 *
 * @param {string} templateGroup - the template group
 * @return {string[]} - list of rendered template names
 */
module.exports.getRenderedTemplateNamesInGroup = function getRenderedTemplateNamesInGroup(templateGroup) {
  return getTemplateNamesInGroup(templateGroup)
    .map(file => {
      return file.replace(/.j2$/, '');
    });
};

module.exports.getTemplateProperty = function getTemplateProperty(templateGroup, templateName, propertyName) {
  const metadata = getTemplateMetadata(templateGroup);

  return _.get(metadata, ['templates', templateGroup, templateName, propertyName]);
};

module.exports.getOutputDirectoryHierarchy = function getOutputDirectoryHierarchy(templateGroup) {
  const metadata = getTemplateMetadata(templateGroup);

  return _.get(metadata, 'outputDirectoryHierarchy', []);
};

module.exports.usesTidyOutput = function usesTidyOutput(templateGroup) {
  const metadata = getTemplateMetadata(templateGroup);

  return _.get(metadata, 'tidyOutput', true);
};

function getTemplateMetadata(templateGroup) {
  return yaml.safeLoad(fs.readFileSync(`${dataPath}/input/templates/${templateGroup}/metadata.yml`, {encoding: 'utf8'}));
}

/**
 * Save a rendered template
 *
 * @param {string} renderedText - the rendered text
 * @param {string} directoryToSaveTo - the directory for the template
 * @param {string} templateFilename - the filename of the template
 * @param {boolean} isExecutable - whether or not the file should be marked executable
 */
module.exports.saveRenderedTemplate = function saveRenderedTemplate(renderedText, directoryToSaveTo, templateFilename, isExecutable) {
  const newTemplateFilename = templateFilename.replace(/.j2$/, '');

  fs.ensureDirSync(directoryToSaveTo);
  fs.writeFileSync(`${directoryToSaveTo}/${newTemplateFilename}`, renderedText, {mode: isExecutable ? 0o777 : 0o666});
};

module.exports.getGlobalTypeForInput = function getGlobalTypeForInput(type) {
  switch(type) {
    case 'application':
      return 'allApplications';
    case 'environment':
      return 'allEnvironments';
    case 'container':
      return 'allContainerTemplates';
  }
};

module.exports.getRenderVarsTypeForInput = function getRenderVarsTypeForInput(type) {
  switch(type) {
    case 'application':
      return 'allApplications';
    case 'environment':
      return 'allEnvironments';
    case 'container':
      return 'allContainers';
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