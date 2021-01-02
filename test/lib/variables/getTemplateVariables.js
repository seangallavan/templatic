'use strict';

require('chai').should();
const data = require('../../../lib/data');
const variables = require('../../../lib/variables');


describe('lib/variables/getTemplateVariables', () => {
  let vars;

  before('load template variables', () => {
    data.setDataPath(__dirname + '/../../data');
  });

  before('global vars', () => {
    vars = variables.getGlobalVars();
  });

  const templateGroup = 'templateGroup001';
  const templateName = 'template001.txt';
  const scope = {
    applications: ['application001', 'application002'],
    environments: ['environment001', 'environment002'],
    templateGroups: ['templateGroup001'],
    containers: ['container001', 'container002'],
    templateNames: ['template001.txt'],
  };
  const constraints = {
    application: 'application001',
    environment: 'environment001',
  };

  describe('fully specified scope; 2 constraints', () => {
    let renderVars;

    before('load template variables', () => {
      renderVars = variables.getTemplateVariables(templateGroup, templateName, constraints, scope,vars);
    });

    describe('application', () => {
      it('application vars', () => {
        renderVars.application.should.exist;
        renderVars.application.appVar1.should.equal('appVal1');
        renderVars.application.template.appVar1.should.equal('overriddenValue');
      });

      it('application container renderVars', () => {
        renderVars.application.containers.length.should.equal(1);
        renderVars.application.containers[0].name.should.equal('container001');
        renderVars.application.containers[0].cvar1.should.equal('cval1');
        Object.keys(renderVars.application.containersByName).length.should.equal(1);
        renderVars.application.containersByName.container001.name.should.equal('container001');
        renderVars.application.containersByName.container001.cvar1.should.equal('cval1');
        renderVars.application.containersByName.container001.templates.should.exist;
        renderVars.application.containersByName.container001.templates.templateGroup001["template001.txt"].cVar3.should.equal('cVal2');
        renderVars.application.containersByName.container001.template.cVar3.should.equal('cVal2');
      });

      it('application environment renderVars', () => {
        renderVars.application.environments.length.should.equal(1);
        renderVars.application.environments[0].name.should.equal('environment001');
        renderVars.application.environments[0].evar1.should.equal('eval1');

        Object.keys(renderVars.application.environmentsByName).length.should.equal(1);
        renderVars.application.environmentsByName.environment001.name.should.equal('environment001');
        renderVars.application.environmentsByName.environment001.evar1.should.equal('eval1');
        renderVars.application.environmentsByName.environment001.template.should.eql({});
      });
    });

    describe('environment', () => {
      it('environment renderVars', () => {
        renderVars.environment.should.exist;
        renderVars.environment.name.should.equal('environment001');
        renderVars.environment.evar1.should.equal('eval1');

        renderVars.environment.name.should.equal('environment001');
        renderVars.environment.evar1.should.equal('eval1');
        renderVars.environment.template.should.eql({});
      });
    });

    describe('container', () => {
      it('container renderVars', () => {
        renderVars.containers.should.exist;
        renderVars.containers.length.should.equal(1);
        renderVars.containers[0].name.should.equal('container001');
        renderVars.containers[0].cvar1.should.equal('cval1');
        Object.keys(renderVars.containersByName).length.should.equal(1);
        renderVars.containersByName.container001.name.should.equal('container001');
        renderVars.containersByName.container001.cvar1.should.equal('cval1');
        renderVars.containersByName.container001.templates.should.exist;
        renderVars.containersByName.container001.templates.templateGroup001["template001.txt"].cVar3.should.equal('cVal2');
        renderVars.containersByName.container001.template.cVar3.should.equal('cVal2');
      });
    });
  });
});
