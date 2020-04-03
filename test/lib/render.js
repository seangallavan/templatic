'use strict';

const should = require('chai').should();

const render = require('../../lib/render');

describe.skip('lib/render.js', () => {
  describe('getTemplateRenderVars', () => {
    describe('main template vars', () => {
      let templateRenderVars;

      before('getVars', () => {
        const vars = render.getVariablesForEnvironment('application008', 'environment001');
        templateRenderVars = render.testing.getTemplateRenderVars('templateGroup001', 'template001.j2', vars);
      });

      it('should have template property', () => {
        console.log(templateRenderVars);
        templateRenderVars.template.var001.should.equal('val001');
      });
    });

    describe('container template vars', () => {
      let templateRenderVars;

      before('getVars', () => {
        const vars = render.getVariablesForEnvironment('application009', 'environment001');
        templateRenderVars = render.testing.getTemplateRenderVars('templateGroup001', 'template001.j2', vars);
      });

      it('should have template property', () => {
        templateRenderVars.containers[0].template.var001.should.equal('val003');
      });
    });
  });

  describe('renderTemplate', () => {
    describe('basic', () => {
      let rendered;

      before('getVars', () => {
        const vars = render.getVariablesForEnvironment('application001', 'environment001');
        rendered = render.renderTemplates('templateGroup001', 'template001.j2', ['application', 'environment'], `${data.getDataPath()}/output/templateGroup001/template001.j2`, vars);
      });

      it('should render correctly', () => {
        rendered.should.equal('application001');
      });
    });

  });
});