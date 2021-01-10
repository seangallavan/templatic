'use strict';

const data = require('../lib/data');
const render = require('../lib/render');
const variables = require('../lib/variables');
const scope = require('../lib/scope');

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

  const thisScope = scope.getScope(argv);

  const vars = variables.getGlobalVars();
  data.saveGlobalVars(vars);

  thisScope.templateGroups.forEach(templateGroup => {
    const outputDirectoryHierarchy = data.getOutputDirectoryHierarchy(templateGroup);
    const templateNames = thisScope.templateNames || data.getTemplateNamesInGroup(templateGroup);

    scope.validateScope(argv, outputDirectoryHierarchy);

    templateNames.forEach(templateName => {
      render.renderTemplateOrFile(templateGroup, templateName, thisScope, vars);
    });
  });
};
