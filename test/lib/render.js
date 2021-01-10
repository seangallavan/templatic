'use strict';

require('chai').should();
const sinon = require('sinon');

const variables = require('../../lib/variables');
const render = require('../../lib/render');
const data = require('../../lib/data');

describe('lib/render.js', () => {
  let vars;

  before('setDataPath', () => {
    data.setDataPath(__dirname + '/../data');
  });

  before('global vars', () => {
    vars = variables.getGlobalVars();
  });

  describe('renderTemplateInstance', () => {
    let rendered;
    let renderVars;

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
    }

    before('getTemplateVariables', () => {
      renderVars = variables.getTemplateVariables('templateGroup001',
        'template001.txt', constraints, scope, vars);
    });

    before('renderTemplateInstance', () => {
      rendered = render.testing.renderTemplateInstance('templateGroup001',
        'template001.txt.j2', renderVars);
    });

    it('should render correctly', () => {
      rendered.should.equal('application001');
    });
  });

  describe('renderTemplate', () => {
    let args;
    let spy;
    const scope = {
      applications: ['application001', 'application002'],
      environments: ['environment001', 'environment002'],
      templateGroups: ['templateGroup001'],
      containers: ['container001', 'container002'],
      templateNames: ['template001.txt.j2'],
    };

    before('setup spy', () => {
      spy = sinon.spy(render.testing, 'renderTemplateRecursive');
    });

    after('restore spy', () => {
      spy.restore();
    });

    before('call renderTemplate', () => {
      render.renderTemplate('templateGroup001', 'template001.txt.j2', scope, vars);

      args = spy.firstCall.args;
    });

    it('should be called with the correct template group', () => {
      args[0].should.equal('templateGroup001');
    });

    it('should be called with the correct template name', () => {
      args[1].should.equal('template001.txt.j2');
    });

    it('should be called with the correct directory hierarchy', () => {
      args[2].length.should.equal(data.getOutputDirectoryHierarchy('templateGroup001').length);
      args[2][0].should.equal('application');
      args[2][1].should.equal('environment');
    });

    it('should be called with the correct directory level', () => {
      args[3].should.equal(0);
    });

    it('should be called with the directory tp save to', () => {
      args[4].should.deep.equal(`${data.getDataPath()}/output/templateGroup001`);
    });

    it('should be called with the correct render vars', () => {
      args[5].should.deep.equal({});
    });

    it('should be called with the correct scope', () => {
      args[6].should.deep.equal(scope);
    });

  });
});
