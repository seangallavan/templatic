'use strict';

const _ = require('lodash');
const Nunjucks = require('nunjucks');

const data = require('../lib/data');

let nunjucks = {};
let hasBeenInitialized = false;

/**
 * Initialize nunjucks
 */
function init() {
  if(hasBeenInitialized) {
    return;
  }

  data.getTemplateGroupNames().forEach(templateGroup => {
    if (!nunjucks[templateGroup]) {
      nunjucks[templateGroup] = new Nunjucks.Environment(new Nunjucks.FileSystemLoader(`${data.getDataPath()}/input/templates/${templateGroup}`));
    }
  });
}

/**
 * Render a template
 *
 * @param {string} templateGroup - the group name for the template
 * @param {string} templateName - template to render
 * @param {string} directoryHierarchy - the directory hierarchy to output to
 * @param {string} directoryToSaveTo - the directory to save output to
 * @param {object} vars - variables
 * @return {string} - the rendered template
 */
module.exports.renderTemplate = function renderTemplate(templateGroup, templateName, directoryHierarchy, directoryToSaveTo, vars) {
  const directory = directoryHierarchy.shift();

  if(!directoryHierarchy.length) {
    const renderedText = renderTemplateInstance(templateGroup, templateName, vars);
    data.saveRenderedTemplate(renderedText, directoryToSaveTo, templateName);
  } else {
    Object.keys(vars[`${directory}s`]).forEach(targetName => {
      vars[directory] = vars[`${directory}s`][directory][targetName];

      module.exports.renderTemplates(templateGroup, templateName, directoryHierarchy, `${directoryToSaveTo}/${targetName}`, vars);
    });
  }
};

/**
 * Render a template
 *
 * @param {string} templateGroup - the group name for the template
 * @param {string} templateName - template to render
 * @param {object} vars - variables
 * @return {string} - the rendered template
 */
function renderTemplateInstance(templateGroup, templateName, vars) {
  init();

  const templateRenderVars = getTemplateRenderVars(templateGroup, templateName, vars);

  return nunjucks[templateGroup].render(templateName, templateRenderVars);
}


/**
 * Get variables to render a template
 *
 * @param {string} templateGroup - the group name for the template
 * @param {string} templateName - template to render
 * @param {object} vars - variables
 * @return {string} - the rendered template
 */
function getTemplateRenderVars(templateGroup, templateName, vars) {
  const newVars = JSON.parse(JSON.stringify(vars));

  newVars.template = _.get(newVars, ['templates', templateGroup, templateName], {});

  newVars.containers.forEach(container => {
    container.template = _.get(container, ['templates', templateGroup, templateName], {});
  });

  return newVars;
}

// /**
//  * Render a container
//  *
//  * @param {object} container - the container
//  * @param {object} vars - the variables
//  * @return {object} - the container rendered
//  */
// function renderContainer(container, vars) {
//   const merged = _.merge({}, {containerName: nunjucks.renderString(container.name, vars)}, vars);
//
//   return renderObject(container, merged);
// }
//
// /**
//  * Render an object
//  *
//  * @param {object} obj - object to render
//  * @param {object} vars - variables
//  * @return {object} - rendered object
//  */
// function renderObject(obj, vars) {
//   const result = {};
//
//   Object.keys(obj).forEach(key => {
//     if(typeof obj[key] === 'number' || typeof obj[key] === 'boolean') {
//       result[key] = obj[key];
//     }
//     else if(typeof obj[key] === 'string') {
//       result[key] = containerNunjucks.renderString(obj[key], vars);
//     } else if(Array.isArray(obj[key])) {
//       result[key] = [];
//       obj[key].forEach(item => {
//         result[key].push(renderObject(item, vars));
//       });
//     } else {
//       result[key] = renderObject(obj[key], vars);
//     }
//   });
//
//   return result;
// }

module.exports.testing = {};
module.exports.testing.getTemplateRenderVars = getTemplateRenderVars;
