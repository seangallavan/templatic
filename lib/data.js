'use strict';

const fs = require('fs-extra');
const yaml = require('js-yaml');

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
module.exports.getDataPath = function getDataPath(path) {
  return dataPath;
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
  return getFiles(`${dataPath}/input/templates/${templateGroup}`);
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

module.exports.getTemplateMetadata = function getTemplateMetadata(templateGroup) {
    return yaml.safeLoad(fs.readFileSync(`${dataPath}/input/templates/${templateGroup}/metadata.yml`, {encoding: 'utf8'}));
};

/**
 * Save a rendered template
 *
 * @param {string} renderedText - the rendered text
 * @param {string} directoryToSaveTo - the directory for the template
 * @param {string} templateFilename - the filename of the template
 */
module.exports.saveRenderedTemplate = function saveRenderedTemplate(renderedText, directoryToSaveTo, templateFilename) {
  const newTemplateFilename = templateFilename.replace(/.j2$/, '');

  fs.ensureDirSync(directoryToSaveTo);
  fs.writeFileSync(`${directoryToSaveTo}/${newTemplateFilename}`, renderedText);
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