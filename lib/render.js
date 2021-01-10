'use strict';

const _ = require('lodash');
const Nunjucks = require('nunjucks');
const fs = require('fs-extra');

const data = require('../lib/data');
const variables = require('../lib/variables');

let nunjucks = {};
let hasBeenInitialized = false;

/**
 * Initialize nunjucks
 *
 * @return {undefined}
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
 * @param {object} scope - the scope limits for rendering
 * @param {object} vars - variables without renderVars
 * @return {string} - the rendered template
 */
module.exports.renderTemplateOrFile = function renderTemplateOrFile(templateGroup, templateName, scope, vars) {
  const directoryHierarchy = data.getOutputDirectoryHierarchy(templateGroup);
  const directoryToSaveTo = `${data.getDataPath()}/output/${templateGroup}`;

  return module.exports.testing.renderTemplateOrFileRecursive(templateGroup, templateName, directoryHierarchy, 0, directoryToSaveTo, {}, scope, vars);
};

/**
 * Render a template recursively given template variables
 *
 * @param {string} templateGroup - the group name for the template
 * @param {string} templateName - template to render
 * @param {Array} directoryHierarchy - the directory hierarchy for output
 * @param {number} directoryLevel - the level of the directory hierarchy we're currently processing
 * @param {string} directoryToSaveTo - where to save the rendered template
 * @param {object} constraints - object specifying known resource values at time of render
 * @param {object} scope - the scope limits for rendering
 * @param {object} vars - variables without renderVars
 * @return {undefined}
 */
function renderTemplateOrFileRecursive(templateGroup, templateName, directoryHierarchy, directoryLevel, directoryToSaveTo,
                                 constraints, scope, vars) {
  init();

  if(directoryHierarchy.length === directoryLevel) {
    //If it's not in scope, don't render it
    if(!!constraints.application && !scope.applications.includes(constraints.application)
      || !!constraints.container && !scope.containers.includes(constraints.container)
      || !!constraints.environment && !scope.environments.includes(constraints.environment)) {
      return;
    }

    //If the application restricts environments or containers, honor that
    if(!!constraints.application && !!constraints.container
      && !vars.allApplicationsByName[constraints.application].containers
        .map(resource => resource.name)
        .includes(constraints.container)) {
      return;
    }
    if(!!constraints.application && !!constraints.environment
      && !vars.allApplicationsByName[constraints.application].environments
        .map(resource => resource.name)
        .includes(constraints.environment)) {
      return;
    }

    if(templateName.endsWith('.j2')) {
      const renderVars = variables.getTemplateVariables(templateGroup, templateName, constraints, scope, vars)

      let renderedText = renderTemplateInstance(templateGroup, templateName, renderVars);

      const isExecutable = data.getTemplateProperty(templateGroup, templateName, 'executable') || false;

      data.saveRenderedTemplate(renderedText, directoryToSaveTo, templateName, isExecutable);
    } else {
      fs.copySync(`${process.cwd()}/${data.getDataPath()}/input/templates/${templateGroup}/${templateName}`, `${process.cwd()}/${directoryToSaveTo}/${templateName}`);
    }
    //Save renderVars for the template
    // data.saveRenderVars(renderVars, templateGroup, templateName, directoryToSaveTo);
  } else {
    const directory = directoryHierarchy[directoryLevel];

    scope[`${directory}s`].forEach(targetName => {
      const obj = _.clone(constraints);
      obj[directory] = targetName;

      module.exports.testing.renderTemplateOrFileRecursive(templateGroup, templateName,
        directoryHierarchy, directoryLevel + 1,
        `${directoryToSaveTo}/${targetName}`,
        obj, scope, vars);
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

/**
 * Render a string from a template and renderVars
 *
 * @param {string} template - the contents of the template
 * @param {object} renderVars - renderVars
 * @returns {string} - rendered string
 */
module.exports.renderString = function renderString(template, renderVars) {
  init();

  return Object.values(nunjucks)[0].renderString(template, renderVars);
};

// /**
//  * Make the yaml or json output_old tidy
//  *
//  * @param {string} output - the output_old to tidy
//  * @param {string} extension  - the extension of the template without the .j2
//  */
// function tidyOutput(output, extension) {
//   switch(extension.toLowerCase()) {
//     case 'yaml':
//     case 'yml':
//       const obj = yaml.safeLoad(output);
//       return yaml.safeDump(obj);
//     case 'json':
//       return JSON.stringify(JSON.parse(output), null, '  ');
//     default:
//       return output;
//   }
// }

module.exports.testing = {};
module.exports.testing.renderTemplateInstance = renderTemplateInstance;
module.exports.testing.renderTemplateOrFileRecursive = renderTemplateOrFileRecursive;
