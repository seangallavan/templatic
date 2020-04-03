'use strict';

const config = require('../config');
const data = require('../lib/data');
const render = require('../lib/render');

exports.command = 'generate [-a appNames] [-e envNames] [-g templateGroupNames] [-n templateNames] [-d dataDir]';

exports.desc = 'Generate templates';

exports.builder = {
  appNames: {
    alias: 'a'
  },
  envNames: {
    alias: 'e'
  },
  templateGroups: {
    alias: 'g'
  },
  templateNames: {
    alias: 'n'
  },
  dataDir: {
    alias: 'd'
  },
};

exports.handler = argv => {
  if(argv.dataDir) {
    config.set('dataRepo:path', argv.dataDir);
  }

  const applications = argv.appNames ? argv.appNames.split(',') : data.getApplicationNames();
  const environments = argv.envNames ? argv.envNames.split(',') : data.getEnvironmentNames();
  const templateGroups = argv.templateGroups ? argv.templateGroups.split(',') : data.getTemplateGroupNames();
  const containers = argv.containers ? argv.containers.split(',') : data.getContainerNames();

  const vars = render.getVariables(applications);

  templateGroups.forEach(templateGroup => {
    const metadata = data.getTemplateMetadata(templateGroup);
    const templates = argv.templateGroups ? argv.templateGroups.split(',') : data.getTemplateNamesInGroup(templateGroup);

    templates.forEach(template => {
      render.renderTemplates(templateGroup, template, metadata.outputDirectoryHierarchy, `${config.get('dataRepo:path')}/output/${templateGroup}/${template}`);
    });
  });
  //
  // appNames.forEach(appName => {
  //   console.log(`Processing ${appName}...`);
  //
  //
  //
  //   //Application templates
  //
  //   environments.forEach(environment => {
  //
  //     templateGroups.forEach(templateGroup => {
  //       data.getTemplateNamesInGroup(TEMPLATE_TYPE, templateGroup).forEach(templateFilename => {
  //         if(templateName && templateName !== templateFilename) {
  //           return;
  //         }
  //
  //         const renderedText = render.renderTemplate(TEMPLATE_TYPE, templateGroup, templateFilename, vars);
  //
  //         data.saveRenderedTemplate(appName, TEMPLATE_TYPE, templateGroup, templateFilename, environment, renderedText);
  //       });
  //     });
  //   });
  // });
  //
};
