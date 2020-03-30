'use strict';

const _ = require('lodash');
const yaml = require('js-yaml');
const Nunjucks = require('nunjucks');
const fs = require('fs-extra');

const secrets = require('./secrets');
const config = require('../config');

let nunjucks = {};
const nunjucks2 = new Nunjucks.Environment(
  new Nunjucks.FileSystemLoader('.')
);

function init() {
  fs.readdirSync(`${config.get('dataRepo:path')}/templates`).forEach(categoryDir => {
    if(['.', '..'].includes(categoryDir)) {
      return;
    }

    if(!nunjucks[categoryDir]) {
      nunjucks[categoryDir] = {};
    }

    fs.readdirSync(`${config.get('dataRepo:path')}/templates/${categoryDir}`).forEach(groupDir => {
      if(['.', '..'].includes(groupDir)) {
        return;
      }

      nunjucks[categoryDir][groupDir] = new Nunjucks.Environment(
        new Nunjucks.FileSystemLoader(`${config.get('dataRepo:path')}/templates/${categoryDir}/${groupDir}`)
      );
    });
  });
}
/**
 * Gets the variables specified in the yaml files
 *
 * @param {string} repoName - repo name
 * @param {string} environment - the environment
 * @return {object} - variables object
 */
module.exports.getVariables = function getVariables(repoName, environment, templateGroup = null, templateName = null) {
  const applicationInfo = yaml.safeLoad(fs.readFileSync(`${config.get('dataRepo:path')}/input/applications/${repoName}.yml`, 'utf8'));
  const environmentInfo = yaml.safeLoad(fs.readFileSync(`${config.get('dataRepo:path')}/input/environments/${environment}.yml`, 'utf8'));
  const globalInfo = yaml.safeLoad(fs.readFileSync(`${config.get('dataRepo:path')}/input/global/config.yml`, 'utf8'));

  const merged = mergeObjectsConcatArrays([globalInfo, environmentInfo, applicationInfo]);
  const vars = _.omit(merged, ['containers', 'templates']);
  vars.env = environment;

  //Get port to use locally for health checks
  vars.localHealthCheckPort = 5000 + (Date.now() % 1000);

  //Application level template variables
  if(templateGroup && templateName && _.get(merged, `templates.${templateGroup}.${templateName}`)) {
    Object.keys(merged.templates[templateGroup][templateName]).forEach(variableName => {
      merged[variableName] = merged.templates[templateGroup][templateName][variableName];
    });
  }

  vars.containers = [];
  vars.hasContainer = {};
  merged.containers.forEach(container => {
    const defaults = yaml.safeLoad(fs.readFileSync(`${config.get('dataRepo:path')}/input/containers/${container.type}.yml`, {encoding: 'utf8'}));
    const combined = mergeObjectsConcatArrays([defaults, container]);
    const rendered = renderObject(combined, vars);

    //Container level template variables
    if(templateGroup && templateName && _.get(rendered, `templates.${templateGroup}.${templateName}`)) {
      Object.keys(rendered.templates[templateGroup][templateName]).forEach(variableName => {
        rendered[variableName] = rendered.templates[templateGroup][templateName][variableName];
      });
    }

    vars.containers.push(rendered);
    vars.hasContainer[container.type] = true;
  });

  return vars;
};

function getMergedTemplateVariables(templates, env) {
  const data = {};

  Object.keys(templates).forEach(groupName => {
    data[groupName] = {};

    Object.keys(templates[groupName]).forEach(templateName => {
      data[groupName][templateName] = !!templates[groupName][templateName][env]
        ? _.merge({}, templates[groupName][templateName].default, templates[groupName][templateName][env])
        : templates[groupName][templateName].default;
    });
  });

  return data;
}

/**
 * Gets the masked versions of variables specified in the yaml files
 *
 * @param {string} repoName - repo name
 * @param {string} environment - the environment
 * @return {object} - variables object
 */
module.exports.getMaskedVariables = function getMaskedVariables(repoName, environment) {
  const vars = _.cloneDeep(module.exports.getVariables(repoName, environment));

  Object.keys(vars.secrets).forEach(key => {
    vars.secrets[key].value = '${SECRET_' + vars.secrets[key].id + '}';
  });

  return vars;
};

/**
 * Render a template
 *
 * @param {string} template - template to render
 * @param {object} vars - variables
 * @return {string} - the rendered template
 */
module.exports.renderTemplate = function renderTemplate(template, vars) {
  return nunjucks.render(template, vars);
};

/**
 * Render a container
 *
 * @param {object} container - the container
 * @param {object} vars - the variables
 * @return {object} - the container rendered
 */
function renderContainer(container, vars) {
  const merged = _.merge({}, {containerName: nunjucks.renderString(container.name, vars)}, vars);

  return renderObject(container, merged);
}

/**
 * Render an object
 *
 * @param {object} obj - object to render
 * @param {object} vars - variables
 * @return {object} - rendered object
 */
function renderObject(obj, vars) {
  const result = {};

  Object.keys(obj).forEach(key => {
    if(typeof obj[key] === 'number' || typeof obj[key] === 'boolean') {
      result[key] = obj[key];
    }
    else if(typeof obj[key] === 'string') {
      result[key] = nunjucks2.renderString(obj[key], vars);
    } else if(Array.isArray(obj[key])) {
      result[key] = [];
      obj[key].forEach(item => {
        result[key].push(renderObject(item, vars));
      });
    } else {
      result[key] = renderObject(obj[key], vars);
    }
  });

  return result;
}

/**
 * Merge each member of the objectArray using _.merge except arrays which are concatenated
 *
 * @param {[object]} objectArray - array of objects to merge
 * @param {object} combined - the value of the currently combined properties
 * @return {object} - the merged object
 */
function mergeObjectsConcatArrays(objectArray, combined = null) {
  if(!combined) {
    combined = _.merge({}, ...objectArray);
  }

  Object.keys(combined).forEach(propertyName => {
    switch(true) {
      case Array.isArray(combined[propertyName]) && !!combined[propertyName].length:
        const objectsWithProperty = objectArray.filter(obj => !!obj[propertyName]);
        const values = objectsWithProperty.map(obj => obj[propertyName]);
        const filteredValues = values.filter(Boolean);
        const flattened = _.flatten([...filteredValues]);
        const unique = _.uniq(flattened);

        //If it's an array of named objects, merge objects with same name
        if(unique.length && unique[0].name) {
          combined[propertyName] = uniqueByName(unique);
        } else {
          combined[propertyName] = unique;
        }

        break;

      case typeof combined[propertyName] === 'object':
        mergeObjectsConcatArrays(objectArray.filter(obj => !!obj[propertyName]).map(obj => obj[propertyName]), combined[propertyName]);
        break;
    }
  });

  return combined;
}

/**
 * Given arrays of objects with a name property, overwrite values of with the same name instead of concatenate
 *
 * @param {object[]} arrayOfObjects - array of objects to merge
 * @return {object[]} - the merged array
 */
function uniqueByName(arrayOfObjects) {
  const objFromArray = {};

  arrayOfObjects.forEach(obj => {
    objFromArray[obj.name] = obj;
  });

  return Object.values(objFromArray);
}
