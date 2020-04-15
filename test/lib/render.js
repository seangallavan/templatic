'use strict';

const _ = require('lodash');
const should = require('chai').should();
const sinon = require('sinon');
const fs = require('fs');

const variables = require('../../lib/variables');
const render = require('../../lib/render');
const data = require('../../lib/data');
const enrich = require('../../lib/enrich');

describe('lib/render.js', () => {
  describe('renderTemplateInstance', () => {
    describe('basic', () => {
      let rendered;

      before('getVars', () => {
        const vars = variables.getVariables(['application001']);
        const templateVars = _.merge({}, vars, vars.allApplicationsByName['application001']);

        rendered = render.testing.renderTemplateInstance('templateGroup001', 'template001.j2', templateVars);
      });

      it('should render correctly', () => {
        rendered.should.equal('application001');
      });
    });
  });

  describe('renderTemplateRecursive', () => {
    describe('calling enrich.enrichRenderVars', () => {
      let vars;
      let spy;
      let args;

      const scope = {
        applications: ['application010'],
        environments: data.getEnvironmentNames(),
        templateGroups: data.getTemplateGroupNames(),
        containers: data.getContainerNames(),
        templates: null,
      };

      before('setup spy', () => {
        spy = sinon.spy(enrich, 'enrichRenderVars');
      });

      after('restore spy', () => {
        spy.restore();
      });

      before('getVars', () => {
        vars = variables.getVariables(['application010']);
      });

      before('call renderTemplate', () => {
        render.renderTemplate('templateGroup001', 'template001.j2', data.getOutputDirectoryHierarchy('templateGroup001'),
          `${data.getDataPath()}/output`, vars, scope);

        args = spy.firstCall.args;
      });

      it('should call the spy once', () => {
        spy.callCount.should.equal(data.getOutputDirectoryHierarchy('templateGroup001').length);
      });

      it('should be called with the correct first argument', () => {
        args[0].should.deep.equal(vars);
      });

      it('should be called with the correct second argument', () => {
        args[1].should.equal('templateGroup001');
      });

      it('should be called with the correct third argument', () => {
        args[2].should.equal('template001.j2');
      });

      it('should be called with the correct fourth argument', () => {
        args[3].length.should.equal(data.getOutputDirectoryHierarchy('templateGroup001').length);
        args[3][0].should.equal('application');
        args[3][1].should.equal('environment');
      });

      it('should be called with the correct fifth argument', () => {
        args[4].should.deep.equal(scope);
      });
    });
  });

  describe('renderTemplate', () => {
    let vars;
    let rendered;
    const scope = {
      applications: ['application010'],
      environments: data.getEnvironmentNames(),
      templateGroups: data.getTemplateGroupNames(),
      containers: data.getContainerNames(),
      templateNames: null,
    };

    let spy;

    before('setup spy', () => {
      spy = sinon.spy(render.testing, 'renderTemplateRecursive');
    });

    after('restore spy', () => {
      spy.restore();
    });

    before('get vars', () => {
      vars = variables.getVariables(['application010']);
    });

    before('render it', () => {
      render.renderTemplate('templateGroup002', 'template002.j2', data.getOutputDirectoryHierarchy('templateGroup002'), `${data.getDataPath()}/output`, vars, scope);
    });

    before('get rendered file', () => {
      rendered = fs.readFileSync(`${data.getDataPath()}/output/templateGroup002/application010/template002`, {encoding: 'utf8'});
    });

    it('should add global vars', () => {
      const args = spy.firstCall.args;
      args[5].temporaryVars.should.exist;
      args[5].renderVars.should.exist;
      args[5].renderVars.global001.should.equal('value001');
    });

    it('should render correctly', () => {
      rendered.should.equal('application010');
    });
  })
});