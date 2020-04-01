'use strict';

const data = require('../../lib/data');
const render = require('../../lib/render');
const config = require('../../config');

const TEMPLATE_TYPE = 'environment';

exports.command = 'environment <envName> [-a appName] [-g templateGroup] [-n templateName] [-d dataDir]';

exports.desc = 'Generate environment templates';

exports.builder = {
  appName: {
    alias: 'a'
  },
  templateGroup: {
    alias: 'g'
  },
  templateName: {
    alias: 'n'
  },
  dataDir: {
    alias: 'd'
  },
};

exports.handler = argv => {
  if(argv.templateName && !argv.templateGroup) {
    console.log('You must specify a templateGroup if specifying a templateName');
    process.exit(1);
  }

  if(argv.dataDir) {
    config.set('dataRepo:path', argv.dataDir);
  }

  const appNames = argv.appName && argv.appName !== 'all' ? [argv.appName] : data.getApplicationNames();
  const environments = argv.envName && argv.envName !== 'all' ? [argv.envName] : data.getEnvironmentNames();
  const templateGroups = argv.templateGroup && argv.templateGroup !== 'all' ? [argv.templateGroup] : data.getTemplateGroupNames(TEMPLATE_TYPE);
  const templateName = argv.templateName;

  appNames.forEach(appName => {
    console.log(`Processing ${appName}...`);

    //Application templates

    environments.forEach(environment => {
      const vars = render.getVariablesForEnvironment(appName, environment);

      templateGroups.forEach(templateGroup => {
        data.getTemplateNamesInGroup(TEMPLATE_TYPE, templateGroup).forEach(templateFilename => {
          if(templateName && templateName !== templateFilename) {
            return;
          }

          const renderedText = render.renderTemplate(TEMPLATE_TYPE, templateGroup, templateFilename, vars);

          data.saveRenderedTemplate(appName, TEMPLATE_TYPE, templateGroup, templateFilename, environment, renderedText);
        });
      });
    });
  });

};
