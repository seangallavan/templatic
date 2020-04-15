'use strict';

const {execSync} = require('child_process');

const data = require('../lib/data');
const render = require('../lib/render');
const variables = require('../lib/variables');

exports.command = 'execute <type> [-a appNames] [-e envNames] [-c containerNames] [-g templateGroupNames] [-n templateNames] [-d dataDir]';

exports.desc = 'Execute templates of a specific type (setup, deploy, etc.)';

exports.builder = {
  type: {
    requiresArg: true
  },
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
    applications: argv.appNames ? argv.appNames.split(',') : data.getApplicationNames(),
    environments: argv.envNames ? argv.envNames.split(',') : data.getEnvironmentNames(),
    templateGroups: argv.templateGroups ? argv.templateGroups.split(',') : data.getTemplateGroupNames(),
    containers: argv.containerNames ? argv.containerNames.split(',') : data.getContainerNames(),
    templates: argv.templateNames ? argv.templateNames.split(',') : null,
  };

  const vars = variables.getVariables(scope.applications);

  scope.templateGroups.forEach(templateGroup => {
    const outputDirectoryHierarchy = data.getOutputDirectoryHierarchy(templateGroup);
    const templates = scope.templates ? scope.templates : data.getExecutableTemplates(argv.type, templateGroup);
    let outputPath = `${data.getDataPath()}/output/${templateGroup}`;

    templates.forEach(template => {
      executeTemplateRecursive(templateGroup, template, outputDirectoryHierarchy, 0, outputPath, vars, scope);
    });
  });
};

/**
 * Execute template
 *
 * @param {string} templateGroup - the group name for the template
 * @param {string} templateName - template to render
 * @param {string[]} directoryHierarchy - the directory hierarchy to output to
 * @param {number} directoryLevel - the level of the directory hierarchy we're currently processing
 * @param {string} directoryToExecuteFrom - the directory to execute from
 * @param {object} templateVars - the variables used to render a template
 * @param {object} scope - the scope limits for rendering
 * @return {string} - the rendered template
 */
function executeTemplateRecursive(templateGroup, templateName, directoryHierarchy, directoryLevel, directoryToExecuteFrom, templateVars, scope) {
  if(directoryHierarchy.length === directoryLevel) {
    execSync(`${directoryToExecuteFrom}/${templateName.replace(/.j2$/, '')}`);
  } else {
    const directory = directoryHierarchy[directoryLevel];

    scope[`${directory}s`].forEach(targetName => {
      templateVars = _.merge({}, templateVars, _.get(templateVars, [`${directory}s`, targetName], {}));

      templateVars.template = _.merge({}, templateVars.template, _.get(templateVars, [`${directory}s`, targetName, 'templates', templateGroup, templateName], {}));

      executeTemplateRecursive(templateGroup, templateName, directoryHierarchy, directoryLevel + 1,`${directoryToExecuteFrom}/${targetName}`, templateVars, scope);
    });
  }
}
