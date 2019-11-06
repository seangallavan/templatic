'use strict';

const _ = require('lodash');
const yaml = require('js-yaml');
const Nunjucks = require('nunjucks');
const fs = require('fs-extra');

const secrets = require('./secrets');

const nunjucks = new Nunjucks.Environment(
  new Nunjucks.FileSystemLoader(`${__dirname}/../templates`)
);

/**
 * Gets the variables specified in the yaml files
 *
 * @param {string} repoName - repo name
 * @param {string} environment - the environment
 * @return {object} - variables object
 */
module.exports.getVariables = function getVariables(repoName, environment) {
  const repositoryInfo = yaml.safeLoad(fs.readFileSync(`${__dirname}/../yaml/applications/${repoName}.yml`, 'utf8'));
  const repositoryDefaults = yaml.safeLoad(fs.readFileSync(`${__dirname}/../yaml/applications/defaults.yml`, 'utf8'));
  const environmentInfo = yaml.safeLoad(fs.readFileSync(`${__dirname}/../yaml/environments/${environment}.yml`, 'utf8'));
  const vaultInfo = getVaultInfo(environmentInfo.vaultAddr);

  const merged = mergeObjectsConcatArrays([vaultInfo, environmentInfo, repositoryDefaults, repositoryInfo]);
  const vars = _.omit(merged, ['containers', 'shortName', 'secrets', 'secretNames', 'environments']);
  vars.shortName = merged.shortName || merged.name.startsWith('august-') ? merged.name.slice('august-'.length) : merged.name;
  vars.secretNames = repositoryInfo.secrets ? repositoryInfo.secrets.concat(repositoryDefaults.secrets) : repositoryDefaults.secrets;
  vars.environment = environment;
  vars.env = environment.replace('-aws', '');

  //Get port to use locally for health checks
  vars.localHealthCheckPort = 5000 + (Date.now() % 1000);

  vars.secrets = {};
  for(let secretNum = 0; secretNum < vars.secretNames.length; secretNum++) {
    vars.secrets[vars.secretNames[secretNum]] = secrets.getSecret(vars.secretNames[secretNum]);
  }

  vars.containers = [];
  vars.containersByType = {};
  merged.containers.forEach(container => {
    const defaults = yaml.safeLoad(fs.readFileSync(`${__dirname}/../yaml/containers/${container.type}.yml`, {encoding: 'utf8'}));
    const combined = mergeObjectsConcatArrays([defaults, container]);
    const rendered = renderContainer(combined, vars);
    vars.containers.push(rendered);
    vars.containersByType[container.type] = rendered;
  });

  vars.hasNodejs = !!vars.containersByType.nodejs;
  vars.hasVault = !!vars.containersByType.vault;
  vars.hasNginx = !!vars.containersByType.nginx;
  vars.hasStatic = !!vars.containersByType.static;
  vars.hasDind = !!vars.containersByType.dind;

  if(_.get(merged, `environment.${environment}`)) {
    return mergeObjectsConcatArrays([vars, merged.environment[environment]]);
  }

  return vars;
};

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
      result[key] = nunjucks.renderString(obj[key], vars);
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
 * Gets the vault info
 *
 * @param {string} vaultAddress - the vault address
 * @return {object} - vault ojbect
 */
function getVaultInfo(vaultAddress) {
  return {
    vaultAddress,
    vaultRoleID: '${VAULT_ROLE_ID}',
    vaultSecretID: '${VAULT_SECRET_ID}',
  };
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
