'use strict';

const _ = require('lodash');
const yaml = require('js-yaml');

const data = require('../lib/data');
const render = require('../lib/render');

module.exports.enrichRenderVars = function enrichRenderVars(templateVars, templateGroup, templateName, directoryHierarchy, scope) {
  //Render container vars
  enrichRenderVarsWithRenderedContainerVars(templateVars);

  //Setup allContainers, allContainersByType, allApplications, etc.
  enrichRenderVarsWithCollectionOfAllInputTypes(templateVars);

  //Setup applications, containers, etc.
  enrichRenderVarsWithCollectionOfUsedInputTypes(templateVars, directoryHierarchy);

  //Merge variables
  enrichRenderVarsWithMergedVariables(templateVars, directoryHierarchy, scope);

  //Setup template property
  if(directoryHierarchy.includes('environment')) {
    enrichRenderVarsWithTemplateProperty(templateVars, templateGroup, templateName, scope['environments'][0]);
  } else {
    enrichRenderVarsWithTemplateProperty(templateVars, templateGroup, templateName);
  }
};

function enrichRenderVarsWithRenderedContainerVars(templateVars) {
  const renderVars = templateVars.renderVars;

  renderVars.allContainers = [];
  renderVars.allContainersByName = {};
  Object.keys(_.get(templateVars, 'allContainerTemplatesByName', {})).forEach(containerName => {
    const rendered =  yaml.safeLoad(render.renderString(templateVars.allContainerTemplatesByName[containerName], templateVars.temporaryVars));
    renderVars.allContainers.push(rendered);
    renderVars.allContainersByName[containerName] = rendered;
  });
}

function enrichRenderVarsWithCollectionOfAllInputTypes(templateVars) {
  const renderVars = templateVars.renderVars;

  data.getInputTypes().forEach(inputType => {
    renderVars[data.getRenderVarsTypeForInput(inputType)] = [];
    renderVars[`${data.getRenderVarsTypeForInput(inputType)}ByName`] = {};

    Object.keys(_.get(templateVars, `${data.getGlobalTypeForInput(inputType)}ByName`, {})).forEach(inputName => {
      if (inputType === 'container') {
        const rendered = yaml.safeLoad(render.renderString(templateVars.allContainerTemplatesByName[inputName], templateVars.temporaryVars));
        renderVars.allContainers.push(rendered);
        renderVars.allContainersByName[inputName] = rendered;
      } else {
        renderVars[data.getRenderVarsTypeForInput(inputType)].push(_.get(templateVars, [`${data.getGlobalTypeForInput(inputType)}ByName`, inputName], {}));
        renderVars[`${data.getRenderVarsTypeForInput(inputType)}ByName`][inputName] = _.get(templateVars, [`${data.getGlobalTypeForInput(inputType)}ByName`, inputName], {});
      }
    });
  });
}

function enrichRenderVarsWithCollectionOfUsedInputTypes(templateVars, directoryHierarchy) {
  const renderVars = templateVars.renderVars;

  data.getInputTypes().forEach(inputType => {
    if(!directoryHierarchy.includes(inputType)) {
      renderVars[`${inputType}s`] = renderVars[data.getRenderVarsTypeForInput(inputType)];
      renderVars[`${inputType}sByName`] = renderVars[`${data.getRenderVarsTypeForInput(inputType)}ByName`];
    }
  });
}

function enrichRenderVarsWithMergedVariables(templateVars, directoryHierarchy, scope) {
  const renderVars = templateVars.renderVars;

  directoryHierarchy.forEach(inputType => {
    _.merge(renderVars, _.get(renderVars, [`${data.getRenderVarsTypeForInput(inputType)}ByName`, scope[`${inputType}s`][0]], {}));
  });
}

function enrichRenderVarsWithTemplateProperty(templateVars, templateGroup, templateName, environment = null) {
  const renderVars = templateVars.renderVars;

  renderVars.template = _.get(renderVars, ['templates', templateGroup, templateName], {});

  data.getInputTypes().forEach(inputType => {
    Object.keys(renderVars[`${data.getRenderVarsTypeForInput(inputType)}ByName`]).forEach(inputName => {
      _.set(renderVars, [`${data.getRenderVarsTypeForInput(inputType)}ByName`, inputName, 'template'],
        getForEnvironment(_.get(renderVars, [`${data.getRenderVarsTypeForInput(inputType)}ByName`, inputName, 'templates', templateGroup, templateName], {}), environment));
    });
  });
}

function getForEnvironment(vars, environment) {
  return _.merge({}, vars.default, vars[environment] || {});
}

module.exports.testing = {};
module.exports.testing.enrichRenderVarsWithRenderedContainerVars = enrichRenderVarsWithRenderedContainerVars;
module.exports.testing.enrichRenderVarsWithCollectionOfAllInputTypes = enrichRenderVarsWithCollectionOfAllInputTypes;
module.exports.testing.enrichRenderVarsWithCollectionOfUsedInputTypes = enrichRenderVarsWithCollectionOfUsedInputTypes;
module.exports.testing.enrichRenderVarsWithMergedVariables = enrichRenderVarsWithMergedVariables;
module.exports.testing.enrichRenderVarsWithTemplateProperty = enrichRenderVarsWithTemplateProperty;
module.exports.testing.getForEnvironment = getForEnvironment;
