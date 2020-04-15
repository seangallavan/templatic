'use strict';

const argv = require('yargs').argv;
const fs = require('fs-extra');

const data = require('./lib/data');

const outputDir = './output';

module.exports = (async function () {
  if(!argv.a) {
    console.log('Syntax:');
    console.log('node publish.js -a <application_name|all>');
    process.exit(1);
  }

  const appNames = argv.a && argv.a !== 'all' ? [argv.a] : data.getApplicationNames();
  const environments = data.getEnvironmentNames();
  const templateGroups = data.getTemplateGroupNames();

  //Global templates


  appNames.forEach(appName => {
    console.log(`Processing ${appName}...`);
    const appDir = `../${appName}`;

    templateGroups.forEach(templateGroup => {
      const templateNames = data.getRenderedTemplateNamesInGroup(templateGroup);

      templateNames.forEach(templateName => {
        environments.forEach(environment => {
          if(templateGroup === 'kubernetes') {
            const templateBaseName = templateName.replace(/.yml$/, '');
            fs.copySync(`${outputDir}/${environment}/${templateGroup}/${templateName}`, `${appDir}/deploy/k8s-${templateBaseName}-${environment}.yml`);
          } else {
            fs.copySync(`${outputDir}/${environment}/${templateGroup}/${templateName}`, `${appDir}/deploy/${templateName}`);
          }
        });
      });
    });
  });

  process.exit(0);
})();
