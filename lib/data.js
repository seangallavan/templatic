'use strict';

const _ = require('lodash');
const fs = require('fs-extra');
const yaml = require('js-yaml');
const enfsfind = require("enfsfind");

let dataPath;

/**
 * Set the path to the data directory
 *
 * @param {string} path - the path
 * @return {undefined}
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
 * Get list of input_old types
 *
 * @return {string[]} - input_old types
 */
module.exports.getInputTypes = function getInputTypes() {
  return ['application', 'container', 'environment'];
};

module.exports.getResourceNames = function getResourceNames(type) {
  return getFilesBasename(`${dataPath}/input/${type}s`).filter(name => name !== 'base');
}

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
  return enfsfind.findSync(`${dataPath}/input/templates/${templateGroup}`, {})
    .filter(fileObj => !fs.lstatSync(fileObj.path).isDirectory())
    .filter(fileObj => !fileObj.path.endsWith('metadata.yml'))
    .map(fileObj => fileObj.path.replace(`${module.exports.getDataPath()}/input/templates/${templateGroup}/`, ''));
};

/**
 * Gets a property from the template metadata
 *
 * @param {string} templateGroup - template group
 * @param {string} templateName - template name
 * @param {string} propertyName - property name
 * @returns {*} - property data
 */
module.exports.getTemplateProperty = function getTemplateProperty(templateGroup, templateName, propertyName) {
  const metadata = getTemplateMetadata(templateGroup);

  return _.get(metadata, ['templates', templateGroup, templateName, propertyName]);
};

/**
 * get output directory hierarchy
 *
 * @param {string} templateGroup - the template group
 * @returns {string[]} - array of directories
 */
module.exports.getOutputDirectoryHierarchy = function getOutputDirectoryHierarchy(templateGroup) {
  const metadata = getTemplateMetadata(templateGroup);

  return _.get(metadata, 'outputDirectoryHierarchy', []);
};

/**
 * get script group members
 *
 * @param {string} templateGroup - the template group
 * @returns {string[]} - array of directories
 */
module.exports.getScriptGroupMembers = function getScriptGroupMembers(templateGroup, scriptGroupName) {
  const metadata = getTemplateMetadata(templateGroup);

  return _.get(metadata, ['scriptGroups', scriptGroupName], []);
};

/**
 * whether or not tidy output is enabled
 *
 * @param {string} templateGroup - the template group
 * @returns {boolean} - whether it's enabled or not
 */
module.exports.usesTidyOutput = function usesTidyOutput(templateGroup) {
  const metadata = getTemplateMetadata(templateGroup);

  return _.get(metadata, 'tidyOutput', true);
};

/**
 * get the template metadata as a string
 *
 * @param {string} templateGroup - the template group
 * @returns {string} - metadata
 */
function getTemplateMetadata(templateGroup) {
  return yaml.safeLoad(fs.readFileSync(`${dataPath}/input/templates/${templateGroup}/metadata.yml`, {encoding: 'utf8'}));
}

/**
 * Save global variables to data/output/vars.yml
 * @param {object} vars - the variables
 * @return {undefined}
 */
module.exports.saveGlobalVars = function saveGlobalVars(vars) {
    fs.outputFileSync(`${module.exports.getDataPath()}/output/vars.yml`, yaml.safeDump(vars, {noRefs: true}));
}

/**
 * Save a rendered template
 *
 * @param {string} renderedText - the rendered text
 * @param {string} directoryToSaveTo - the directory for the template
 * @param {string} templateFilename - the filename of the template
 * @param {number} mode - whether or not the file should be marked executable
 * @return {undefined}
 */
module.exports.saveRenderedTemplate = function saveRenderedTemplate(renderedText, directoryToSaveTo, templateFilename, mode) {
  const newFilename = templateFilename.replace(/.j2$/, '');

  fs.outputFileSync(`${directoryToSaveTo}/${newFilename}`, renderedText, {mode});
};

/**
 * Save renderVars
 *
 * @param {object} renderVars - renderVars
 * @param {string} templateGroup - template group
 * @param {string} templateName - template name
 * @param {string} directoryToSaveTo - the directory to save the renderVars in
 * @return {undefined}
 */
module.exports.saveRenderVars = function saveRenderVars(renderVars, templateGroup, templateName, directoryToSaveTo) {
  fs.outputFileSync(`${directoryToSaveTo}/renderVars/${templateName}_renderVars.yml`, yaml.safeDump(renderVars, {noRefs: true}));
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
