'use strict';

const fs = require('fs-extra');

const render = require('../lib/render');
const applications = require('../lib/applications');
const config = require('../config');

const K8S_APPS_PATH = `${__dirname}/../generated/apps`;

module.exports = (async function () {
  await require('../server');

  if(!process.argv[2]) {
    console.log('generate.js requires an argument of the environment (i.e., dev)');
    process.exit(1);
  }
  const environment = process.argv[2];
  const appNames = process.argv[3] ? [process.argv[3]] : applications.getApplicationNames();

  appNames.forEach(appName => {
    console.log(`Processing ${appName}...`);

    config.get('regions').forEach(region => {
      region.envs.forEach(env => {
        if(env.name === environment) {
          const envName = env.name;
          const vars = render.getMaskedVariables(appName, envName);

          saveVariableFiles(appName, envName, vars);
          saveJenkinsFiles(appName, envName, vars);
          saveKubernetesFiles(appName, envName, vars);
          saveDeployerFiles(appName, envName, vars);
          saveArgoCDFiles(appName, envName, vars);
          saveECRFiles(appName, envName, vars);
        }
      });
    });
  });

  process.exit(0);
})();

function saveVariableFiles(appName, env, vars) {
  const directory = `${K8S_APPS_PATH}/${appName}/variables/${env}`;
  fs.ensureDirSync(directory);

  fs.writeFileSync(`${directory}/variables.json`, JSON.stringify(vars, null, '  '));
}

function saveKubernetesFiles(appName, env, vars) {
  const directory = `${K8S_APPS_PATH}/${appName}/kubernetes/${env}`;
  fs.ensureDirSync(directory);

  templateTypes.kubernetes.forEach(templateType => {
    if(templateType === 'service' && !vars.hasNginx) {
      return;
    }

    const templateName = `k8s-${templateType}.yml.j2`;
    const rendered = render.renderTemplate(templateName, vars);

    fs.writeFileSync(`${directory}/${templateType}.yml`, rendered);
  });
}

function saveJenkinsFiles(appName, env, vars) {
  const directory = `${K8S_APPS_PATH}/${appName}/jenkins/${env}`;
  fs.ensureDirSync(directory);

  templateTypes.jenkins.forEach(templateType => {
    const templateName = `${templateType}.sh.j2`;
    const rendered = render.renderTemplate(templateName, vars);

    fs.writeFileSync(`${directory}/${templateType}.sh`, rendered);
  });
}

function saveDeployerFiles(appName, env, vars) {
  const directory = `${K8S_APPS_PATH}/${appName}/deployer/${env}`;
  fs.ensureDirSync(directory);

  templateTypes.deployer.forEach(templateType => {
    const templateName = `deployer-${templateType}.sh.j2`;
    const rendered = render.renderTemplate(templateName, vars);

    fs.writeFileSync(`${directory}/${templateType}.sh`, rendered);
  });
}

function saveArgoCDFiles(appName, env, vars) {
  const directory = `${K8S_APPS_PATH}/${appName}/argocd/${env}`;
  fs.ensureDirSync(directory);

  templateTypes.argocd.forEach(templateType => {
    const templateName = `argocd-${templateType}.json.j2`;
    const rendered = render.renderTemplate(templateName, vars);

    fs.writeFileSync(`${directory}/${templateType}.json`, rendered);
  });
}

function saveECRFiles(appName, env, vars) {
  const directory = `${K8S_APPS_PATH}/${appName}/ecr/${env}`;
  fs.ensureDirSync(directory);

  templateTypes.ecr.forEach(templateType => {
    const templateName = `ecr-${templateType}.sh.j2`;
    const rendered = render.renderTemplate(templateName, vars);

    fs.writeFileSync(`${directory}/${templateType}.sh`, rendered);
  });
}
