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
  });

  vars.global = yaml.safeLoad(fs.readFileSync(`${data.getDataPath()}/input/vars.yml`, 'utf8'));

  return vars;
};

function getVariablesForApplication(appName) {
  if(getFromCache('application', appName)) {
    return getFromCache('application', appName);
  }

  const applicationInfo = yaml.safeLoad(fs.readFileSync(`${data.getDataPath()}/input/applications/${appName}.yml`, 'utf8'));

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

function getFromCache(type, name) {
  return _.get(variableCache, [type, name]);
}

function setToCache(type, name, vars) {
  return _.set(variableCache, [type, name], vars);
}

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

module.exports.testing = {};
module.exports.testing.mergeObjectsConcatArrays = mergeObjectsConcatArrays;
module.exports.testing.getVariablesForApplication = getVariablesForApplication;
module.exports.testing.getVariablesForEnvironment = getVariablesForEnvironment;
module.exports.testing.getTemplateForContainer = getTemplateForContainer;
