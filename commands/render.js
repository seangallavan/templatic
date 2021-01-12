'use strict';

const data = require('../lib/data');
const render = require('../lib/render');
const variables = require('../lib/variables');
const scope = require('../lib/scope');

exports.command = 'render [-a appNames] [-e envNames] [-c containerNames] [-d dataDir] <templatePaths>';

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
  dataDir: {
    alias: 'd'
  },
  templatePaths: {
    required: true,
  },
};

exports.handler = argv => {
  data.setDataPath(argv.dataDir ? argv.dataDir : process.cwd());

  const thisScope = scope.getScope(argv);

  const vars = variables.getGlobalVars();
  data.saveGlobalVars(vars);

  thisScope.templates.forEach(template => {
    const templateGroup = template.split('/')[0];
    const outputDirectoryHierarchy = data.getOutputDirectoryHierarchy(templateGroup);
    const templateNames = thisScope.templateNames || data.getTemplateNamesInGroup(templateGroup);

    scope.validateScope(argv, outputDirectoryHierarchy);

    templateNames.forEach(templateName => {
      render.renderTemplateOrFile(templateGroup, templateName, thisScope, vars);
    });
  });
};
