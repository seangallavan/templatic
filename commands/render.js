'use strict';

const data = require('../lib/data');
const render = require('../lib/render');
const variables = require('../lib/variables');

exports.command = 'render [-a appNames] [-e envNames] [-c containerNames] [-g templateGroupNames] [-n templateNames] [-d dataDir]';

exports.desc = 'Render templates';

exports.builder = {
  appNames: {
    alias: 'a'
  },
  envNames: {
    alias: 'e'
  },
  containerNames: {
    alias: 'c'
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
  data.setDataPath(argv.dataDir ? argv.dataDir : process.cwd());

  const scope = {
    applications: argv.appNames ? argv.appNames.split(',') : data.getResourceNames('application'),
    environments: argv.envNames ? argv.envNames.split(',') : data.getResourceNames('environment'),
    templateGroups: argv.templateGroups ? argv.templateGroups.split(',') : data.getTemplateGroupNames(),
    containers: argv.containerNames ? argv.containerNames.split(',') : data.getResourceNames('container'),
    templateNames: argv.templateNames ? argv.templateNames.split(',') : undefined,
  };

  const vars = variables.getGlobalVars();
  data.saveGlobalVars(vars);

  scope.templateGroups.forEach(templateGroup => {
    const outputDirectoryHierarchy = data.getOutputDirectoryHierarchy(templateGroup);
    const templateNames = scope.templateNames ? scope.templateNames.split(',') : data.getTemplateNamesInGroup(templateGroup);

    if(argv.appNames && !outputDirectoryHierarchy.includes('application')) {
      console.log('Unable to process a template group which requires all applications when specifying a list');
      process.exit(1);
    }

    if(argv.envNames && !outputDirectoryHierarchy.includes('environment')) {
      console.log('Unable to process a template group which requires all environments when specifying a list');
      process.exit(1);
    }

    if(argv.containerNames && !outputDirectoryHierarchy.includes('containers')) {
      console.log('Unable to process a template group which requires all containers when specifying a list');
      process.exit(1);
    }

    templateNames.forEach(templateName => {
      render.renderTemplate(templateGroup, templateName, scope, vars);
    });
  });
};
