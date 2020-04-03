'use strict';

const _ = require('lodash');
const yaml = require('js-yaml');
const Nunjucks = require('nunjucks');
const fs = require('fs-extra');

const config = require('../config');
const data = require('../lib/data');

const variableCache = {};
let nunjucks = {};
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
    new Nunjucks.FileSystemLoader(`${config.get('dataRepo:path')}/input/containers`)
  );

  data.getTemplateGroupNames().forEach(templateGroup => {
    if (!nunjucks[templateGroup]) {
      nunjucks[templateGroup] = new Nunjucks.Environment(new Nunjucks.FileSystemLoader(`${config.get('dataRepo:path')}/input/templates/${templateGroup}`));
    }
  });
}

/**
 * Gets the variables specified in the yaml files
 *
 * @param {string} appName - repo name
 * @return {object} - variables object
 */
module.exports.getVariablesForApplication = function getVariablesForApplication(appName) {
  const applicationInfo = yaml.safeLoad(fs.readFileSync(`${config.get('dataRepo:path')}/input/applications/${appName}.yml`, 'utf8'));
  const globalInfo = yaml.safeLoad(fs.readFileSync(`${config.get('dataRepo:path')}/input/vars.yml`, 'utf8'));

  const vars = mergeObjectsConcatArrays([globalInfo, _.omit(applicationInfo, ['containers', 'templates'])]);

  //Get port to use locally for health checks
  vars.localHealthCheckPort = 5000 + (Date.now() % 3000);

  vars.hasContainer = {};
  applicationInfo.containers.forEach(applicationInfoContainerData => {
    vars.hasContainer[applicationInfoContainerData.type] = true;
  });

  vars.containers = [];
  applicationInfo.containers.forEach(applicationInfoContainerData => {
    const defaults = yaml.safeLoad(containerNunjucks.render(`${applicationInfoContainerData.type}.yml.j2`, vars));
    const combined = mergeObjectsConcatArrays([defaults, applicationInfoContainerData]);

    vars.containers.push(combined);
  });

  return vars;
};

module.exports.getVariables = function getVariables(appNames = null) {
  init();

  const vars = {};
  vars.applications = {};
  vars.environments = {};
  vars.containers = {};

  if(!appNames) {
    appNames = data.getApplicationNames();
  }

  appNames.forEach(appName => {
    vars.applications[appName] = getVariablesForApplication(appName);
  });

  data.getEnvironmentNames().forEach(environment => {
    vars.environments[environment] = getVariablesForEnvironment(environment);
  });

  data.getContainerNames().forEach(container => {
    console.log(container);
    vars.containers[container] = getVariablesForContainer(container);
  });

  return vars;
};

function getVariablesForApplication(appName) {
  if(getApplicationVariablesFromCache(appName)) {
    return getApplicationVariablesFromCache(appName);
  }

  const applicationInfo = yaml.safeLoad(fs.readFileSync(`${config.get('dataRepo:path')}/input/applications/${appName}.yml`, 'utf8'));
  applicationInfo.environments = {};

  data.getEnvironmentNames().forEach(environment => {
    applicationInfo.environments[environment] = getVariablesForEnvironment(environment);
  });

  const globalInfo = yaml.safeLoad(fs.readFileSync(`${config.get('dataRepo:path')}/input/vars.yml`, 'utf8'));

  const vars = mergeObjectsConcatArrays([globalInfo, _.omit(applicationInfo, ['containers'/*, 'templates'*/])]);

  //Get port to use locally for health checks
  vars.localHealthCheckPort = 5000 + (Date.now() % 3000);

  //Get Template Vars
  // if(applicationInfo.templates) {
  //   vars.templates = {};
  //   Object.keys(applicationInfo.templates).forEach(templateGroupName => {
  //     vars.templates[templateGroupName] = {};
  //
  //     Object.keys(applicationInfo.templates[templateGroupName]).forEach(templateName => {
  //       const envInfo = _.get(applicationInfo, `templates['${templateGroupName}']['${templateName}'].environmentOverrides['${environment}']`, {});
  //       const defaultInfo = _.get(applicationInfo.templates[templateGroupName][templateName], 'default', {});
  //
  //       vars.templates[templateGroupName][templateName] = mergeObjectsConcatArrays([defaultInfo, envInfo]);
  //     });
  //   });
  // }

  vars.hasContainer = {};
  applicationInfo.containers.forEach(applicationInfoContainerData => {
    vars.hasContainer[applicationInfoContainerData.type] = true;
  });

  vars.containers = [];
  applicationInfo.containers.forEach(applicationInfoContainerData => {
    const defaults = yaml.safeLoad(containerNunjucks.render(`${applicationInfoContainerData.type}.yml.j2`, vars));
    const combined = mergeObjectsConcatArrays([defaults, applicationInfoContainerData]);

    // //Get Template Vars
    // if(combined.templates) {
    //   Object.keys(combined.templates).map(templateGroupName => {
    //     Object.keys(combined.templates[templateGroupName]).forEach(templateName => {
    //       const envInfo = _.get(combined, `templates['${templateGroupName}']['${templateName}'].environmentOverrides['${environment}']`, {});
    //       const defaultInfo = _.get(combined.templates[templateGroupName][templateName], 'default', {});
    //
    //       combined.templates[templateGroupName][templateName] = mergeObjectsConcatArrays([defaultInfo, envInfo]);
    //     });
    //   });
    // }

    vars.containers.push(combined);
  });

  setApplicationVariablesToCache(appName, vars);

  return vars;
}

function getVariablesForEnvironment(environment) {
  if(getEnvironmentVariablesFromCache(environment)) {
    return getEnvironmentVariablesFromCache(environment);
  }

  const environmentInfo = yaml.safeLoad(fs.readFileSync(`${config.get('dataRepo:path')}/input/environments/${environment}.yml`, 'utf8'));
  let parentEnvironmentInfo = {};
  if(environmentInfo.inherits) {
    parentEnvironmentInfo = yaml.safeLoad(fs.readFileSync(`${config.get('dataRepo:path')}/input/environments/${environmentInfo.inherits}.yml`, 'utf8'));
  }

  const vars = _.merge({}, parentEnvironmentInfo, environmentInfo);

  setEnvironmentVariablesToCache(environment, vars);

  return vars;
}

function getVariablesForContainer(container) {
  if(getContainerVariablesFromCache(container)) {
    return getContainerVariablesFromCache(container);
  }

  const vars = yaml.safeLoad(fs.readFileSync(`${config.get('dataRepo:path')}/input/containers/${container}.yml`, 'utf8'));
  setContainerVariablesToCache(container, vars);

  return vars;
}

function getApplicationVariablesFromCache(appName) {
  return _.get(variableCache, ['applications', appName]);
}

function getEnvironmentVariablesFromCache(environment) {
  return _.get(variableCache, ['environments', environment]);
}

function getContainerVariablesFromCache(container) {
  return _.get(variableCache, ['container', container]);
}

function setApplicationVariablesToCache(appName, vars) {
  return _.set(variableCache, ['applications', appName], vars);
}

function setEnvironmentVariablesToCache(environment, vars) {
  return _.set(variableCache, ['environments', environment], vars);
}

function setContainerVariablesToCache(container, vars) {
  return _.set(variableCache, ['containers', container], vars);
}

// /**
//  * Get application variables
//  *
//  * @param {Array} outputDirectoryHierarchy - array of levels of hierarchy for output directory
//  * @reutrns {object} - the variables
//  */
// module.exports.getVariables = function getVariables(outputDirectoryHierarchy) {
//
// };

/**
 * Gets the variables specified in the yaml files
 *
 * @param {string} appName - repo name
 * @param {string} environment - the environment
 * @return {object} - variables object
 */
module.exports.getVariablesForEnvironment = function getVariablesForEnvironment(appName, environment) {
  init();

  const applicationInfo = yaml.safeLoad(fs.readFileSync(`${config.get('dataRepo:path')}/input/applications/${appName}.yml`, 'utf8'));
  const environmentInfo = yaml.safeLoad(fs.readFileSync(`${config.get('dataRepo:path')}/input/environments/${environment}.yml`, 'utf8'));
  let parentEnvironmentInfo = {};
  if(environmentInfo.inherits) {
    parentEnvironmentInfo = yaml.safeLoad(fs.readFileSync(`${config.get('dataRepo:path')}/input/environments/${environmentInfo.inherits}.yml`, 'utf8'));
  }

  const globalInfo = yaml.safeLoad(fs.readFileSync(`${config.get('dataRepo:path')}/input/vars.yml`, 'utf8'));

  const vars = mergeObjectsConcatArrays([globalInfo, _.omit(applicationInfo, ['containers', 'templates']), parentEnvironmentInfo, environmentInfo]);
  vars.environment = environment;

  //Get port to use locally for health checks
  vars.localHealthCheckPort = 5000 + (Date.now() % 3000);

  //Get Template Vars
  if(applicationInfo.templates) {
    vars.templates = {};
    Object.keys(applicationInfo.templates).forEach(templateGroupName => {
      vars.templates[templateGroupName] = {};

      Object.keys(applicationInfo.templates[templateGroupName]).forEach(templateName => {
        const envInfo = _.get(applicationInfo, `templates['${templateGroupName}']['${templateName}'].environmentOverrides['${environment}']`, {});
        const defaultInfo = _.get(applicationInfo.templates[templateGroupName][templateName], 'default', {});

        vars.templates[templateGroupName][templateName] = mergeObjectsConcatArrays([defaultInfo, envInfo]);
      });
    });
  }

  vars.hasContainer = {};
  applicationInfo.containers.forEach(applicationInfoContainerData => {
    vars.hasContainer[applicationInfoContainerData.type] = true;
  });

  vars.containers = [];
  applicationInfo.containers.forEach(applicationInfoContainerData => {
    const defaults = yaml.safeLoad(containerNunjucks.render(`${applicationInfoContainerData.type}.yml.j2`, vars));
    const combined = mergeObjectsConcatArrays([defaults, applicationInfoContainerData]);

    //Get Template Vars
    if(combined.templates) {
      Object.keys(combined.templates).map(templateGroupName => {
        Object.keys(combined.templates[templateGroupName]).forEach(templateName => {
          const envInfo = _.get(combined, `templates['${templateGroupName}']['${templateName}'].environmentOverrides['${environment}']`, {});
          const defaultInfo = _.get(combined.templates[templateGroupName][templateName], 'default', {});

          combined.templates[templateGroupName][templateName] = mergeObjectsConcatArrays([defaultInfo, envInfo]);
        });
      });
    }

    vars.containers.push(combined);
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

module.exports.renderTemplates = function renderTemplates(templateGroup, templateName, directoryHierarchy, directoryToSaveTo, vars) {
  const directory = directoryHierarchy.shift();

  if(!directoryHierarchy.length) {
    const renderedText = renderTemplate(templateGroup, templateName, vars);
    data.saveRenderedTemplate(renderedText, directoryToSaveTo, templateName);
  } else {
    Object.keys(vars[`${directory}s`]).forEach(targetName => {
      vars[directory] = vars[`${directory}s`][directory][targetName];

      renderTemplates(templateGroup, templateName, directoryHierarchy, `${directoryToSaveTo}/${targetName}`, vars);
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
function renderTemplate(templateGroup, templateName, vars) {
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
      result[key] = containerNunjucks.renderString(obj[key], vars);
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

module.exports.testing = {};
module.exports.testing.mergeObjectsConcatArrays = mergeObjectsConcatArrays;
module.exports.testing.getTemplateRenderVars = getTemplateRenderVars;
// module.exports.testing.uniqueByName = uniqueByName;