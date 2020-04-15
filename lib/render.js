'use strict';

const _ = require('lodash');
const Nunjucks = require('nunjucks');
const yaml = require('js-yaml');

const data = require('../lib/data');
const enrich = require('../lib/enrich');

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
 * @param {string[]} directoryHierarchy - the directory hierarchy to output to
 * @param {string} outputDirectory - the directory to save output to
 * @param {object} vars - variables
 * @param {object} scope - the scope limits for rendering
 * @return {string} - the rendered template
 */
module.exports.renderTemplate = function renderTemplate(templateGroup, templateName, directoryHierarchy, outputDirectory, vars, scope) {
  vars.renderVars = _.cloneDeep(vars.global);
  vars.temporaryVars = {};

  module.exports.testing.renderTemplateRecursive(templateGroup, templateName, directoryHierarchy, 0, `${outputDirectory}/${templateGroup}`, vars, scope);
};

/**
 * Render a template recursively given template variables
 *
 * @param {string} templateGroup - the group name for the template
 * @param {string} templateName - template to render
 * @param {string[]} directoryHierarchy - the directory hierarchy to output to
 * @param {number} directoryLevel - the level of the directory hierarchy we're currently processing
 * @param {string} directoryToSaveTo - the directory to save output to
 * @param {object} templateVars - the variables used to render a template
 * @param {object} scope - the scope limits for rendering
 * @return {string} - the rendered template
 */
function renderTemplateRecursive(templateGroup, templateName, directoryHierarchy, directoryLevel, directoryToSaveTo, templateVars, scope) {
  init();
  console.log(JSON.stringify(templateVars.renderVars));

  if(directoryHierarchy.length === directoryLevel) {
    enrich.enrichRenderVars(templateVars, templateGroup, templateName, directoryHierarchy, scope);

    let renderedText = module.exports.testing.renderTemplateInstance(templateGroup, templateName, templateVars.renderVars);

    const isExecutable = data.getTemplateProperty(templateGroup, templateName, 'executable') || false;

    data.saveRenderedTemplate(renderedText, directoryToSaveTo, templateName, isExecutable);
  } else {
    const directory = directoryHierarchy[directoryLevel];

    //Add to templateVars.temporaryVars to later render container vars
    if(directory !== 'container') {
        scope[`${directory}s`].forEach(targetName => {
          _.merge(templateVars.temporaryVars, _.get(templateVars, [data.getGlobalTypeForInput(directory), targetName], {}));
      });
    }

    scope[`${directory}s`].forEach(targetName => {
      scope[`${directory}s`] = [targetName];

      module.exports.testing.renderTemplateRecursive(templateGroup, templateName, directoryHierarchy, directoryLevel + 1,`${directoryToSaveTo}/${targetName}`, templateVars, scope);
    });
  }
}

/**
 * Render a template instance
 *
 * @param {string} templateGroup - the group name for the template
 * @param {string} templateName - template to render
 * @param {object} renderVars - variables
 * @return {string} - the rendered template text
 */
function renderTemplateInstance(templateGroup, templateName, renderVars) {
  init();

  return nunjucks[templateGroup].render(templateName, renderVars);
}

module.exports.renderString = function renderString(template, vars) {
  init();

  return Object.values(nunjucks)[0].renderString(template, vars);
};

/**
 * Make the yaml or json output tidy
 *
 * @param {string} output - the output to tidy
 * @param {string} extension  - the extension of the template without the .j2
 */
function tidyOutput(output, extension) {
  switch(extension.toLowerCase()) {
    case 'yaml':
    case 'yml':
      const obj = yaml.safeLoad(output);
      return yaml.safeDump(obj);
    case 'json':
      return JSON.stringify(JSON.parse(output), null, '  ');
    default:
      return output;
  }
}

// /**
//  * Render a container
//  *
//  * @param {object} obj - the container
//  * @param {object} vars - the variables
//  * @return {object} - the container rendered
//  */
// module.exports.renderContainer = function renderContainer(obj, vars) {
//   init();
//
//   const result = {};
//
//   Object.keys(obj).forEach(key => {
//     if(typeof obj[key] === 'number' || typeof obj[key] === 'boolean') {
//       result[key] = obj[key];
//     }
//     else if(typeof obj[key] === 'string') {
//       result[key] = nunjucks[Object.keys(nunjucks)[0]].renderString(obj[key], vars);
//     } else if(Array.isArray(obj[key])) {
//       result[key] = [];
//       obj[key].forEach(item => {
//         result[key].push(renderContainer(item, vars));
//       });
//     } else {
//       result[key] = renderContainer(obj[key], vars);
//     }
//   });
//
//   return result;
// };

module.exports.testing = {};
module.exports.testing.renderTemplateInstance = renderTemplateInstance;
module.exports.testing.renderTemplateRecursive = renderTemplateRecursive;
// module.exports.testing.renderContainer = renderContainer;
