'use strict';

const fs = require('fs-extra');

const config = require('../config');

const inputFolder = `${config.get('dataRepo:path')}/input`;
const outputFolder = `${config.get('dataRepo:path')}/output`;

/**
 * Get list of applications
 *
 * @return {string[]} - list of apps
 */
module.exports.getApplicationNames = function getApplicationNames() {
  return getFilesBasename(`${inputFolder}/applications`);
};

/**
 * Get list of environments
 *
 * @return {string[]} - list of environments
 */
module.exports.getEnvironmentNames = function getEnvironmentNames() {
  return getFilesBasename(`${inputFolder}/environments`);
};

/**
 * Get list of template groups
 *
 * @return {string[]} - list of template groups
 */
module.exports.getTemplateGroupNames = function getTemplateGroupNames() {
  return getFilesBasename(`${inputFolder}/templates`);
};

/**
 * Get list of template groups
 *
 * @param {string} templateGroup - the template group
 * @return {string[]} - list of template groups
 */
module.exports.getTemplatesInGroup = function getTemplatesInGroup(templateGroup) {
  return getFiles(`${inputFolder}/templates/${templateGroup}`);
};

/**
 * Save a rendered template
 *
 * @param {string} appName - the application name
 * @param {string} templateDir - the directory for the template
 * @param {string} templateFilename - the filename of the template
 * @param {string} environment - the environment
 * @param {string} renderedText - the rendered text
 */
module.exports.saveRenderedTemplate = function saveRenderedTemplate(appName, templateDir, templateFilename, environment, renderedText) {
  const newTemplateFilename = templateFilename.replace(/.j2$/, '');

  fs.ensureDirSync(`${outputFolder}/applications/${appName}/${templateDir}/${environment}`);
  fs.writeFileSync(`${outputFolder}/applications/${appName}/${templateDir}/${environment}/${newTemplateFilename}`, renderedText);
};

/**
 * Get an array of base filenames (filenames without the .yml suffix)
 *
 * @param {string} dir - the directory
 * @returns {string[]} - the base filenames
 */
function getFilesBasename(dir) {
  return getFiles(dir)
    .map(filename => filename.replace('.yml', ''));
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