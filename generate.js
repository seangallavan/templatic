'use strict';

const argv = require('yargs').argv;

const render = require('./lib/render');
const data = require('./lib/data');

module.exports = (async function () {
  if(!argv.a || !argv.e) {
    console.log('Syntax:');
    console.log('node generate.js -a [application_name|all] -e [environment_name|all]');
    process.exit(1);
  }
  const appNames = process.argv.a ? [process.argv.a] : data.getApplicationNames();
  const environments = process.argv.e ? [process.argv.e] : data.getEnvironmentNames();
  const templateGroups = data.getTemplateGroupNames();

  appNames.forEach(appName => {
    console.log(`Processing ${appName}...`);

    environments.forEach(environment => {
      const vars = render.getVariables(appName, environment);
console.log('VVV');
console.log(JSON.stringify(vars));
      templateGroups.forEach(templateGroup => {

        data.getTemplatesInGroup(templateGroup).forEach(templateFilename => {
          const renderedText = render.renderTemplate(templateGroup, templateFilename, vars);

          data.saveRenderedTemplate(appName, templateGroup, templateFilename, environment, renderedText);
        });
      });
    });
  });

  process.exit(0);
})();
