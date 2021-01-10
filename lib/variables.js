'use strict';

const _ = require('lodash');
const yaml = require('js-yaml');
const fs = require('fs-extra');

const data = require('./data');

let varCache;

/**
 * Gets global variables
 *
 * @returns {object} - global vars
 */
module.exports.getGlobalVars = function getGlobalVariables() {
  if (varCache) {
    return varCache;
  }

  const vars = {};

  ['environment', 'container', 'application'].forEach(type => {
    vars[`all${_.capitalize(type)}s`] = [];
    vars[`all${_.capitalize(type)}sByName`] = {};

    data.getResourceNames(type).forEach(resourceName => {
      const resourceVars = getVariablesForResource(type, resourceName);
      vars[`all${_.capitalize(type)}s`].push(resourceVars);
      vars[`all${_.capitalize(type)}sByName`][resourceName] = resourceVars;
    });
  });

  vars.globals = yaml.safeLoad(fs.readFileSync(`${data.getDataPath()}/input/globals.yml`, 'utf8')) || {};

  addContainerAndEnvironmentToApplications(vars);

  varCache = vars;

  return vars;
}

/**
 * Adds the container and environment to an appliation resource
 *
 * @param {object} vars - global vars
 * @returns {undefined}
 */
function addContainerAndEnvironmentToApplications(vars) {
  vars.allApplications.forEach(app => {
    ['container', 'environment'].forEach(resource => {
      if (app[`${resource}s`]) {
        const mergedResources = [];

        app[`${resource}s`].forEach(subresource => {
          const merged = _.merge({}, vars[`all${_.capitalize(resource)}sByName`][subresource.name], subresource);
          mergedResources.push(merged);
        });

        app[`${resource}s`] = mergedResources;
        vars.allApplicationsByName[app.name][`${resource}s`] = mergedResources;
      }
    });
  });
}

/**
 * Get template variables for a particular template
 *
 * @param {string} templateGroup - the name of the template group
 * @param {string} templateName - the name of the template
 * @param {object} constraints - rendering constraints (i.e., application, container, environment)
 * @param {object|undefined} constraints.application - application constraints
 * @param {object|undefined} constraints.container - container constraints
 * @param {object|undefined} constraints.environment - environment constraints
 * @param {object} scope - the scope limits for rendering
 * @param {object} vars - variables used to generate renderVars
 * @returns {object} - renderVars
 */
module.exports.getTemplateVariables = function getTemplateVariables(templateGroup, templateName, constraints, scope, vars) {
  addTemplateLinks(vars, templateGroup, templateName);

  //renderVars holds the variables used to render a particular template
  const renderVars = {};

  //link existing directories
  Object.keys(vars).forEach(varName => {
    renderVars[varName] = vars[varName];
  });

  if(constraints.application) {
    renderVars.application = getResourceRenderVarsForApplication(constraints, vars, scope);
  } else {
    const resourceRenderVars = getResourceRenderVarsForApplication(constraints, vars, scope);
    renderVars.applications = resourceRenderVars;
    renderVars.allApplicationsByName = resourceRenderVars.reduce((accumulator, currentValue) => accumulator[currentValue.name] = currentValue, {});
  }

  ['environment', 'container'].forEach(type => {
    if (constraints[type]) {
      if(vars.allApplicationsByName[constraints.application][`${type}sByName`][constraints[type]]) {
        renderVars[type] = getResourceRenderVarsForEnvironmentOrContainer(type, constraints, vars, scope);
      }
    } else {
      const resourceRenderVars = getResourceRenderVarsForEnvironmentOrContainer(type, constraints, vars, scope);
      renderVars[`${type}s`] = resourceRenderVars;
      renderVars[`${type}sByName`] = resourceRenderVars.reduce((accumulator, currentValue) => {
        accumulator[currentValue.name] = currentValue;

        return accumulator;
      }, {});
    }
  });

  return renderVars;
}

/**
 * Add template links to variables
 *
 * @param {object} vars - global vars
 * @param {string} templateGroup - template group
 * @param {string} templateName - template name
 * @return {undefined}
 */
function addTemplateLinks(vars, templateGroup, templateName) {
  vars.allApplications.forEach(app => {
    app.template = _.get(app, ['templates', templateGroup, templateName], {});

    if (app.containers) {
      app.containers.forEach(container => {
        container.template = _.get(container, ['templates', templateGroup, templateName], {});
        app.containersByName[container.name].template = container.template;
      });
    }

    if (app.environments) {
      app.environments.forEach(environment => {
        environment.template = _.get(environment, ['templates', templateGroup, templateName], {});
        app.environmentsByName[environment.name].template = environment.template;
      });
    }
  });

  ['allContainers', 'allEnvironments'].forEach(allContainersOrEnvironments => {
    vars[allContainersOrEnvironments].forEach(containerOrEnvironment => {
      containerOrEnvironment.template = _.get(containerOrEnvironment, ['templates', templateGroup, templateName], {});
    });
  });
}

/**
 * get render vars for an application
 *
 * @param {object} constraints - constraints
 * @param {object} vars - global vars
 * @param {object} scope - scope
 * @returns {object} - render vars for application
 */
function getResourceRenderVarsForApplication(constraints, vars, scope) {
  switch(true) {
    case constraints.application && !scope.applications.includes(constraints.application):
      return {};

    case !!constraints.application:
      return vars.allApplicationsByName[constraints.application];

    default:
      return vars.allApplications.filter(app => scope.applications.includes(app.name));
  }
}

/**
 * gets rendervars for environment or container
 *
 * @param {string} resourceType - environment or container
 * @param {object} constraints - constraints
 * @param {object} vars - global vars
 * @param {object} scope - scope
 * @returns {object} - resource render vars
 */
function getResourceRenderVarsForEnvironmentOrContainer(resourceType, constraints, vars, scope) {
  switch(true) {
    case !!constraints[resourceType] && !scope[`${resourceType}s`].includes(constraints[resourceType]):
      return {};

    case !!constraints.application && !!constraints[resourceType]:
      return vars.allApplicationsByName[constraints.application][`${resourceType}sByName`][constraints[resourceType]];

    case !!constraints.application:
     return vars.allApplicationsByName[constraints.application][`${resourceType}s`];

    case !!constraints[resourceType]:
      return vars[`all${_.capitalize(resourceType)}sByName`][constraints[resourceType]];

    default:
     return vars[`all${_.capitalize(resourceType)}s`].filter(resource => scope[`${resourceType}s`].includes(resource.name));
  }
}

/**
 * get variables for a resource
 *
 * @param {string} resourceType - type of resource
 * @param {string} resourceName - name of resource
 * @returns {object} - variables for resource
 */
function getVariablesForResource(resourceType, resourceName) {
  const info = yaml.safeLoad(fs.readFileSync(`${data.getDataPath()}/input/${resourceType}s/${resourceName}.yml`, 'utf8'));
  let parentInfo = {};
  if (info.inherits) {
    parentInfo = yaml.safeLoad(fs.readFileSync(`${data.getDataPath()}/input/${resourceType}s/base/${info.inherits}.yml`, 'utf8'));
  }

  const merged = _.merge({}, parentInfo, info);
  if(!merged.templates) {
    merged.templates = {};
  }

  if (resourceType === 'application') {
    ['container', 'environment'].forEach(containerOrEnvironment => {
      if (merged[`${containerOrEnvironment}s`]) {
        merged[`${containerOrEnvironment}sByName`] = {};
        merged[`${containerOrEnvironment}s`].forEach(resource => {
          merged[`${containerOrEnvironment}sByName`][resource.name] = resource;
        });
      } else {
        merged[`${containerOrEnvironment}s`] = [];
        merged[`${containerOrEnvironment}sByName`] = {};

        data.getResourceNames(containerOrEnvironment).forEach(resourceName => {
          const resource = yaml.safeLoad(fs.readFileSync(`${data.getDataPath()}/input/${containerOrEnvironment}s/${resourceName}.yml`, 'utf8'))
          merged[`${containerOrEnvironment}s`].push(resource);
          merged[`${containerOrEnvironment}sByName`][resource.name] = resource;
        });
      }
    });
  }

  return merged;
}

/**
 * Merge each member of the objectArray using _.merge except arrays which are concatenated
 *
 * @param {object[]} objectArray - array of objects to merge
 * @param {object} combined - the value of the currently combined properties
 * @return {object} - the merged object
 */
function mergeObjectsConcatArrays(objectArray, combined = null) {
  if (!combined) {
    combined = _.merge({}, ...objectArray);
  }

  Object.keys(combined).forEach(propertyName => {
    switch (true) {
      case Array.isArray(combined[propertyName]):
        var objectsWithProperty = objectArray.filter(obj => !!obj[propertyName]);
        var values = objectsWithProperty.map(obj => obj[propertyName]);
        var filteredValues = values.filter(Boolean);
        var flattened = _.flatten([...filteredValues]);
        var unique = _.uniq(flattened);

        //If it's an array of named objects, merge objects with same name
        if (unique.length && unique[0].name) {
          combined[propertyName] = uniqueByName(unique);
        } else {
          combined[propertyName] = unique;
        }

        break;

      case typeof combined[propertyName] === 'object':
        mergeObjectsConcatArrays(objectArray.filter(obj => !!obj && !!obj[propertyName]).map(obj => obj[propertyName]), combined[propertyName]);
        break;
    }
  });

  return combined;
}

/**
 * Get unique array of objects containing a name property
 *
 * @param {object[]} objArray - the array of objects
 * @return {object[]} - array of unique objects
 */
function uniqueByName(objArray) {
  const names = {};

  for(let i=0; i<objArray.length; i++) {
    if(names[objArray[i].name]) {
      delete objArray[i];
    } else {
      names[objArray[i].name] = true;
    }
  }

  return objArray;
}

module.exports.testing = {};
module.exports.testing.getVariablesForResource = getVariablesForResource;
module.exports.testing.mergeObjectsConcatArrays = mergeObjectsConcatArrays;
