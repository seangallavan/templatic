'use strict';

const _ = require('lodash');
const yaml = require('js-yaml');
const Nunjucks = require('nunjucks');
const fs = require('fs-extra');

const data = require('../lib/data');

const variableCache = {
  applications: [],
  environments: [],
  containers: [],
};
let containerNunjucks = {};
let hasBeenInitialized = false;

/**
 * Initialize nunjucks
 */
function init() {
  if(hasBeenInitialized) {
    return;
  }

  containerNunjucks = new Nunjucks.Environment(
    new Nunjucks.FileSystemLoader(`${data.getDataPath()}/input/containers`)
  );
}

/**
 * Get variables limiting to the apps named if present
 *
 * @param {Array} appNames - the names of the apps to generate variables for
 */
module.exports.getVariables = function getVariables(appNames = null) {
  init();

  const vars = {};
  vars.allApplications = [];
  vars.allEnvironments = [];
  vars.allContainerTemplates = [];
  vars.allApplicationsByName = {};
  vars.allEnvironmentsByName = {};
  vars.allContainerTemplatesByName = {};
  vars.renderVars = {};

  if(!appNames) {
    appNames = data.getApplicationNames();
  }

  appNames.forEach(appName => {
    const appVars = getVariablesForApplication(appName);
    vars.allApplications.push(appVars);
    vars.allApplicationsByName[appName] = appVars;
  });

  data.getEnvironmentNames().forEach(environment => {
    const environmentVars = getVariablesForEnvironment(environment);
    vars.allEnvironments.push(environmentVars);
    vars.allEnvironmentsByName[environment] = environmentVars;
  });

  data.getContainerNames().forEach(container => {
    const containerVars = getTemplateForContainer(container);
    vars.allContainerTemplates.push(containerVars);
    vars.allContainerTemplatesByName[container] = containerVars;
    //
    // const appVars = getVariablesForApplication(appName);
    // vars.allApplications.push(appVars);
    // vars.allApplicationsByName[appName] = appVars;
  });

  vars.global = yaml.safeLoad(fs.readFileSync(`${data.getDataPath()}/input/vars.yml`, 'utf8'));

  return vars;
};

/**
 * Gets the variables specified in the yaml files
 *
 * @param {string} appName - repo name
 * @return {object} - variables object
 */
// module.exports.getVariablesForApplication = function getVariablesForApplication(appName) {
//   const applicationInfo = yaml.safeLoad(fs.readFileSync(`${data.getDataPath()}/input/applications/${appName}.yml`, 'utf8'));
//   const globalInfo = yaml.safeLoad(fs.readFileSync(`${data.getDataPath()}/input/vars.yml`, 'utf8'));
//
//   const vars = mergeObjectsConcatArrays([globalInfo, _.omit(applicationInfo, ['containers', 'templates'])]);
//
//   //Get port to use locally for health checks
//   vars.localHealthCheckPort = 5000 + (Date.now() % 3000);
//
//   vars.hasContainer = {};
//   applicationInfo.containers.forEach(applicationInfoContainerData => {
//     vars.hasContainer[applicationInfoContainerData.type] = true;
//   });
//
//   vars.containers = [];
//   applicationInfo.containers.forEach(applicationInfoContainerData => {
//     const defaults = yaml.safeLoad(containerNunjucks.render(`${applicationInfoContainerData.type}.yml.j2`, vars));
//     const combined = mergeObjectsConcatArrays([defaults, applicationInfoContainerData]);
//
//     vars.containers.push(combined);
//   });
//
//   return vars;
// };
//
function getVariablesForApplication(appName) {
  if(getFromCache('application', appName)) {
    return getFromCache('application', appName);
  }

  const applicationInfo = yaml.safeLoad(fs.readFileSync(`${data.getDataPath()}/input/applications/${appName}.yml`, 'utf8'));
  // applicationInfo.environments = {};
  //
  // data.getEnvironmentNames().forEach(environment => {
  //   applicationInfo.environments[environment] = getVariablesForEnvironment(environment);
  // });

  // const globalInfo = yaml.safeLoad(fs.readFileSync(`${data.getDataPath()}/input/vars.yml`, 'utf8'));
  //
  // const vars = mergeObjectsConcatArrays([globalInfo, _.omit(applicationInfo, ['containers'/*, 'templates'*/])]);

  //Get port to use locally for health checks
  // vars.localHealthCheckPort = 5000 + (Date.now() % 3000);

  //Get Template Vars
  // if(applicationInfo.templates) {
  //   vars.templates = {};
  //   Object.keys(applicationInfo.templates).forEach(templateGroupName => {
  //     vars.templates[templateGroupName] = {};
  //
  //     Object.keys(applicationInfo.templates[templateGroupName]).forEach(templateName => {
  //       const envInfo = _.get(applicationInfo, `templates['${templateGroupName}']['${templateName}'].environments['${environment}']`, {});
  //       const defaultInfo = _.get(applicationInfo.templates[templateGroupName][templateName], 'default', {});
  //
  //       vars.templates[templateGroupName][templateName] = mergeObjectsConcatArrays([defaultInfo, envInfo]);
  //     });
  //   });
  // }

  applicationInfo.hasContainer = {};
  if(applicationInfo.containers) {
    applicationInfo.containers.forEach(applicationInfoContainerData => {
      applicationInfo.hasContainer[applicationInfoContainerData.container] = true;
    });
  }

  applicationInfo.hasEnvironment = {};
  if(applicationInfo.environments) {
    applicationInfo.environments.forEach(environmentData => {
      applicationInfo.hasEnvironment[environmentData.environment] = true;
    });
  }

  // applicationInfo.containers = [];
  // applicationInfo.containers.forEach(applicationInfoContainerData => {
  //   const defaults = yaml.safeLoad(containerNunjucks.render(`${applicationInfoContainerData.type}.yml.j2`, vars));
  //   const combined = mergeObjectsConcatArrays([defaults, applicationInfoContainerData]);

    // //Get Template Vars
    // if(combined.templates) {
    //   Object.keys(combined.templates).map(templateGroupName => {
    //     Object.keys(combined.templates[templateGroupName]).forEach(templateName => {
    //       const envInfo = _.get(combined, `templates['${templateGroupName}']['${templateName}'].environments['${environment}']`, {});
    //       const defaultInfo = _.get(combined.templates[templateGroupName][templateName], 'default', {});
    //
    //       combined.templates[templateGroupName][templateName] = mergeObjectsConcatArrays([defaultInfo, envInfo]);
    //     });
    //   });
    // }

  // applicationInfo.containers.push(combined);
  // });

  setToCache('application', appName, applicationInfo);

  return applicationInfo;
}

function getVariablesForEnvironment(environment) {
  if(getFromCache('environment', environment)) {
    return getFromCache('environment', environment);
  }

  const environmentInfo = yaml.safeLoad(fs.readFileSync(`${data.getDataPath()}/input/environments/${environment}.yml`, 'utf8'));
  let parentEnvironmentInfo = {};
  if(environmentInfo.inherits) {
    parentEnvironmentInfo = yaml.safeLoad(fs.readFileSync(`${data.getDataPath()}/input/environments/${environmentInfo.inherits}.yml`, 'utf8'));
  }

  const vars = _.merge({}, parentEnvironmentInfo, environmentInfo);

  setToCache('environment', environment, vars);

  return vars;
}

function getTemplateForContainer(container) {
  init();

  if(getFromCache('container', container)) {
    return getFromCache('container', container);
  }

  const contents = fs.readFileSync(`${data.getDataPath()}/input/containers/${container}.yml.j2`, {encoding: 'utf8'});
  setToCache('container', container, contents);

  return contents;
}

// function getVariablesForContainer(container) {
//   init();
//
//   if(getContainerVariablesFromCache(container)) {
//     return getContainerVariablesFromCache(container);
//   }
//
//   const vars = yaml.safeLoad(containerNunjucks.render(`${container}.yml.j2`, {}));
//   setContainerVariablesToCache(container, vars);
//
//   return vars;
// }

function getFromCache(type, name) {
  return _.get(variableCache, [type, name]);
}

function setToCache(type, name, vars) {
  return _.set(variableCache, [type, name], vars);
}

// /**
//  * Gets the variables specified in the yaml files
//  *
//  * @param {string} appName - repo name
//  * @param {string} environment - the environment
//  * @return {object} - variables object
//  */
// module.exports.getVariablesForEnvironment = function getVariablesForEnvironment(appName, environment) {
//   init();
//
//   const applicationInfo = yaml.safeLoad(fs.readFileSync(`${data.getDataPath()}/input/applications/${appName}.yml`, 'utf8'));
//   const environmentInfo = yaml.safeLoad(fs.readFileSync(`${data.getDataPath()}/input/environments/${environment}.yml`, 'utf8'));
//   let parentEnvironmentInfo = {};
//   if(environmentInfo.inherits) {
//     parentEnvironmentInfo = yaml.safeLoad(fs.readFileSync(`${data.getDataPath()}/input/environments/${environmentInfo.inherits}.yml`, 'utf8'));
//   }
//
//   const globalInfo = yaml.safeLoad(fs.readFileSync(`${data.getDataPath()}/input/vars.yml`, 'utf8'));
//
//   const vars = mergeObjectsConcatArrays([globalInfo, _.omit(applicationInfo, ['containers', 'templates']), parentEnvironmentInfo, environmentInfo]);
//   vars.environment = environment;
//
//   //Get port to use locally for health checks
//   vars.localHealthCheckPort = 5000 + (Date.now() % 3000);
//
//   //Get Template Vars
//   if(applicationInfo.templates) {
//     vars.templates = {};
//     Object.keys(applicationInfo.templates).forEach(templateGroupName => {
//       vars.templates[templateGroupName] = {};
//
//       Object.keys(applicationInfo.templates[templateGroupName]).forEach(templateName => {
//         const envInfo = _.get(applicationInfo, `templates['${templateGroupName}']['${templateName}'].environments['${environment}']`, {});
//         const defaultInfo = _.get(applicationInfo.templates[templateGroupName][templateName], 'default', {});
//
//         vars.templates[templateGroupName][templateName] = mergeObjectsConcatArrays([defaultInfo, envInfo]);
//       });
//     });
//   }
//
//   vars.hasContainer = {};
//   applicationInfo.containers.forEach(applicationInfoContainerData => {
//     vars.hasContainer[applicationInfoContainerData.type] = true;
//   });
//
//   vars.containers = [];
//   applicationInfo.containers.forEach(applicationInfoContainerData => {
//     const defaults = yaml.safeLoad(containerNunjucks.render(`${applicationInfoContainerData.type}.yml.j2`, vars));
//     const combined = mergeObjectsConcatArrays([defaults, applicationInfoContainerData]);
//
//     //Get Template Vars
//     if(combined.templates) {
//       Object.keys(combined.templates).map(templateGroupName => {
//         Object.keys(combined.templates[templateGroupName]).forEach(templateName => {
//           const envInfo = _.get(combined, `templates['${templateGroupName}']['${templateName}'].environments['${environment}']`, {});
//           const defaultInfo = _.get(combined.templates[templateGroupName][templateName], 'default', {});
//
//           combined.templates[templateGroupName][templateName] = mergeObjectsConcatArrays([defaultInfo, envInfo]);
//         });
//       });
//     }
//
//     vars.containers.push(combined);
//   });
//
//   return vars;
// };

// function getMergedTemplateVariables(templates, env) {
//   const data = {};
//
//   Object.keys(templates).forEach(groupName => {
//     data[groupName] = {};
//
//     Object.keys(templates[groupName]).forEach(templateName => {
//       data[groupName][templateName] = !!templates[groupName][templateName][env]
//         ? _.merge({}, templates[groupName][templateName].default, templates[groupName][templateName][env])
//         : templates[groupName][templateName].default;
//     });
//   });
//
//   return data;
// }

// /**
//  * Gets the masked versions of variables specified in the yaml files
//  *
//  * @param {string} repoName - repo name
//  * @param {string} environment - the environment
//  * @return {object} - variables object
//  */
// module.exports.getMaskedVariables = function getMaskedVariables(repoName, environment) {
//   const vars = _.cloneDeep(module.exports.getVariables(repoName, environment));
//
//   Object.keys(vars.secrets).forEach(key => {
//     vars.secrets[key].value = '${SECRET_' + vars.secrets[key].id + '}';
//   });
//
//   return vars;
// };

// /**
//  * Get variables to render a template
//  *
//  * @param {string} templateGroup - the group name for the template
//  * @param {string} templateName - template to render
//  * @param {object} templateVars - variables
//  * @return {object} - the rendered template
//  */
// module.exports.getTemplateRenderVars = function getTemplateRenderVars(templateGroup, templateName, templateVars) {
//
//   templateVars.template = _.merge(_.get(templateVars, ['templates', templateGroup, templateName, 'environments', environment], {}),
//     _.get(templateVars, ['templates', templateGroup, templateName, 'default'], {}), {});
//
//   Object.keys(templateVars.containers).forEach(containerName => {
//     templateVars.containers[containerName].template = _.merge(_.get(templateVars, ['containers', containerName, 'templates', templateGroup, templateName, 'environments', environment], {}),
//       _.get(templateVars, ['containers', containerName, 'templates', templateGroup, templateName, 'default'], {}), {});
//   });
//
//   return templateVars;
//
//   // const newVars = JSON.parse(JSON.stringify(vars));
//   //
//   // newVars.template = _.get(newVars, ['templates', templateGroup, templateName], {});
//   //
//   // Object.keys(newVars.containers).forEach(containerName => {
//   //   newVars.containers[containerName].template = _.get(vars.containers[containerName], ['templates', templateGroup, templateName], {});
//   // });
//   //
//   // return newVars;
// };
//
/**
 * Merge each member of the objectArray using _.merge except arrays which are concatenated
 *
 * @param {object[]} objectArray - array of objects to merge
 * @param {object} combined - the value of the currently combined properties
 * @return {object} - the merged object
 */
function mergeObjectsConcatArrays(objectArray, combined = null) {
  if(!combined) {
    combined = _.merge({}, ...objectArray);
  }

  Object.keys(combined).forEach(propertyName => {
    switch(true) {
      case Array.isArray(combined[propertyName]):
        const objectsWithProperty = objectArray.filter(obj => !!obj[propertyName]);
        const values = objectsWithProperty.map(obj => obj[propertyName]);
        const filteredValues = values.filter(Boolean);
        const flattened = _.flatten([...filteredValues]);
        const unique = _.uniq(flattened);

        // //If it's an array of named objects, merge objects with same name
        // if(unique.length && unique[0].name) {
        //   combined[propertyName] = uniqueByName(unique);
        // } else {
        combined[propertyName] = unique;
        // }

        break;

      case typeof combined[propertyName] === 'object':
        mergeObjectsConcatArrays(objectArray.filter(obj => !!obj && !!obj[propertyName]).map(obj => obj[propertyName]), combined[propertyName]);
        break;
    }
  });

  return combined;
}

// /**
//  * Given arrays of objects with a name property, overwrite values of with the same name instead of concatenate
//  *
//  * @param {object[]} arrayOfObjects - array of objects to merge
//  * @return {object[]} - the merged array
//  */
// function uniqueByName(arrayOfObjects) {
//   const objFromArray = {};
//
//   arrayOfObjects.forEach(obj => {
//     objFromArray[obj.name] = obj;
//   });
//
//   return Object.values(objFromArray);
// }

module.exports.testing = {};
module.exports.testing.mergeObjectsConcatArrays = mergeObjectsConcatArrays;
module.exports.testing.getVariablesForApplication = getVariablesForApplication;
module.exports.testing.getVariablesForEnvironment = getVariablesForEnvironment;
module.exports.testing.getTemplateForContainer = getTemplateForContainer;
