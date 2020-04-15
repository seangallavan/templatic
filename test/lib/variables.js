'use strict';

const should = require('chai').should();
const yaml = require('js-yaml');
const fs = require('fs');
const Nunjucks = require('nunjucks');

const nunjucks = new Nunjucks.Environment();
const data = require('../../lib/data');
const variables = require('../../lib/variables');
const render = require('../../lib/render');

describe('lib/variables.js', () => {
  describe('mergeObjectsConcatArrays', () => {
    const moca = variables.testing.mergeObjectsConcatArrays;

    describe('numbers or strings', () => {
      const obj1 = {a: 1};
      const obj2 = {a: 2};
      const obj3 = {a: 3};
      let result;

      before('merge objects', () => {
        result = moca([obj1, obj2, obj3]);
      });

      it('should merge correctly', () => {
        result.should.deep.equals({a: 3});
      });
    });

    describe('arrays', () => {
      const obj1 = {a: ['a']};
      const obj2 = {a: ['b']};
      const obj3 = {a: ['c']};
      let result;

      before('merge objects', () => {
        result = moca([obj1, obj2, obj3]);
      });

      it('should merge correctly', () => {
        result.should.deep.equals({a: ['a', 'b', 'c']});
      });
    });

    describe('empty arary', () => {
      const obj1 = {a: ['a']};
      const obj2 = {a: []};
      const obj3 = {a: ['c']};
      let result;

      before('merge objects', () => {
        result = moca([obj1, obj2, obj3]);
      });

      it('should merge correctly', () => {
        result.should.deep.equals({a: ['a', 'c']});
      });
    });

    describe('array with \'0\' value', () => {
      const obj1 = {a: ['a']};
      const obj2 = {a: [0]};
      const obj3 = {a: ['c']};
      let result;

      before('merge objects', () => {
        result = moca([obj1, obj2, obj3]);
      });

      it('should merge correctly', () => {
        result.should.deep.equals({a: ['a', 0,'c']});
      });
    });

    describe('array with duplicates', () => {
      const obj1 = {a: ['a']};
      const obj2 = {a: ['a']};
      const obj3 = {a: ['c']};
      let result;

      before('merge objects', () => {
        result = moca([obj1, obj2, obj3]);
      });

      it('should merge correctly', () => {
        result.should.deep.equals({a: ['a','c']});
      });
    });

    describe('objects', () => {
      const obj1 = {a: {b: 'a'}};
      const obj2 = {a: {b: 'b'}};
      const obj3 = {a: {c: 'c'}};
      let result;

      before('merge objects', () => {
        result = moca([obj1, obj2, obj3]);
      });

      it('should merge correctly', () => {
        result.should.deep.equals({a: {b: 'b', c: 'c'}});
      });
    });

    describe('object of arrays', () => {
      const obj1 = {a: {b: ['a', 'b']}};
      const obj2 = {a: {b: ['c']}};
      let result;

      before('merge objects', () => {
        result = moca([obj1, obj2]);
      });

      it('should merge correctly', () => {
        result.should.deep.equals({a: {b: ['a', 'b', 'c']}});
      });
    });

    describe('object of objects', () => {
      const obj1 = {a: {b: {c: 'd'}}};
      const obj2 = {a: {b: {c: 'h'}}};
      const obj3 = {a: {b: {d: 'l'}}};
      let result;

      before('merge objects', () => {
        result = moca([obj1, obj2, obj3]);
      });

      it('should merge correctly', () => {
        result.should.deep.equals({a: {b: {c: 'h', d: 'l'}}});
      });
    });
  });

  describe('getVariablesForApplication', () => {
    let appVars;

    before('get variables', () => {
      appVars = variables.testing.getVariablesForApplication('application010');
    });

    describe('containers', () => {
      it('should have correct number of containers', () => {
        appVars.containers.length.should.equal(1);
      });

      it('should have correct variables', () => {
        appVars.containers[0].var1.should.equal('val1');
      })
    });

    describe('environments', () => {
      it('should have correct number of environments', () => {
        appVars.environments.length.should.equal(1);
      });

      it('should have correct variables', () => {
        appVars.environments[0].var2.should.equal('val2');
      })
    });

    describe('hasContainer', () => {
      it('should have correct container types', () => {
        appVars.hasContainer.container002.should.be.true;
        should.not.exist(appVars.hasContainer.container003);
      });
    });

    describe('hasEnvironment', () => {
      it('should have correct environment types', () => {
        appVars.hasEnvironment.environment002.should.be.true;
        should.not.exist(appVars.hasEnvironment.environment001);
      });
    });
  });

  describe('getVariablesForEnvironment', () => {
    let envVars;

    before('get variables', () => {
      envVars = variables.testing.getVariablesForEnvironment('environment002');
    });

    describe('basic', () => {
      it('should have correct variables', () => {
        envVars.varRegular2.should.equal('valRegular2');
        envVars.varOverridden.should.equal('valOverridden2');
      });
    });

    describe('inherits', () => {
      it('should have correct variables', () => {
        envVars.varInherited.should.equal('valInherited');
      });
    });
  });

  describe('getTemplateForContainer', () => {
    let templateContents;

    before('get variables', () => {
      templateContents = variables.testing.getTemplateForContainer('container001');
    });

    describe('basic', () => {
      it('should have correct template', () => {
        templateContents.should.equal('name: {{ name }}-container001');
      });
    });
  });

  describe('getVariables', () => {
    describe('no application specified', () => {
      let vars;

      before('getVars', () => {
        vars = variables.getVariables();
      });

      it('should have correct global info', () => {
        vars.global.global001.should.equal('value001');
        Object.keys(vars.allApplications).length.should.equal(data.getApplicationNames().length);
        Object.keys(vars.allContainerTemplates).length.should.equal(data.getContainerNames().length);
        Object.keys(vars.allEnvironments).length.should.equal(data.getEnvironmentNames().length);
      });

      it('should have correct application info', () => {
        const appVars = vars.allApplicationsByName.application001;
        appVars.name.should.equal('application001');
      });

      it('should have correct environment info', () => {
        const envVars = vars.allEnvironmentsByName.environment001;
        envVars.varRegular.should.equal('valRegular');
      });

      it('should have correct container info', () => {
        const containerTemplate = vars.allContainerTemplatesByName.container001;
        containerTemplate.should.equal('name: {{ name }}-container001');
      });
    });

    describe('basic', () => {
      let vars;

      before('getVars', () => {
        vars = variables.getVariables(['application001']);
      });

      it('should only have one application', () => {
        Object.keys(vars.allApplicationsByName).length.should.equal(1);
      });

      it('should have correct application info', () => {
        const appVars = vars.allApplicationsByName.application001;
        appVars.name.should.equal('application001');
      });

      it('should have correct environment info', () => {
        const envVars = vars.allEnvironmentsByName.environment001;
        envVars.varRegular.should.equal('valRegular');
      });

      it('should have correct container info', () => {
        const containerTemplate = vars.allContainerTemplatesByName.container001;

        containerTemplate.should.equal('name: {{ name }}-container001');
      });
    });

    describe('all apps', () => {
      let vars;

      before('getVars', () => {
        vars = variables.getVariables();
      });

      it('should have correct application info', () => {
        vars.global.global001.should.equal('value001');
        Object.keys(vars.allApplicationsByName).length.should.equal(data.getApplicationNames().length);
        Object.keys(vars.allContainerTemplatesByName).length.should.equal(data.getContainerNames().length);
        Object.keys(vars.allEnvironmentsByName).length.should.equal(data.getEnvironmentNames().length);
      });

      it('should have correct environment info', () => {
        const envVars = vars.allEnvironmentsByName.environment001;
        envVars.varRegular.should.equal('valRegular');
      });

      it('should have correct container info', () => {
        const containerTemplate = vars.allContainerTemplatesByName.container001;

        containerTemplate.should.equal('name: {{ name }}-container001');
      });
    });

    describe('with templates', () => {
      describe('all fields provided', () => {
        let vars;

        before('getVars', () => {
          vars = variables.getVariables(['application002']);
        });


        it('should have correct template info', () => {
          const appVars = vars.allApplicationsByName.application002;
          appVars.templates.templateGroup001['template001.j2'].default.var001.should.equal('val001');
          appVars.templates.templateGroup001['template001.j2'].environments.environment001.var001.should.equal('val003');
        });
      });

      describe('empty default field', () => {
        let vars;

        before('getVars', () => {
          vars = variables.getVariables(['application004']);
        });

        it('should have correct template info', () => {
          const appVars = vars.allApplicationsByName.application004;
          appVars.templates.templateGroup001['template001.j2'].environments.environment001.var001.should.equal('val003');
        });
      });

      describe('no default field', () => {
        let vars;

        before('getVars', () => {
          vars = variables.getVariables(['application005']);
        });

        it('should have correct template info', () => {
          const appVars = vars.allApplicationsByName.application005;
          appVars.templates.templateGroup001['template001.j2'].environments.environment001.var001.should.equal('val003');
        });
      });

      describe('env override present but empty', () => {
        let vars;

        before('getVars', () => {
          vars = variables.getVariables(['application006']);
        });

        it('should have correct template info', () => {
          const appVars = vars.allApplicationsByName.application006;
          appVars.templates.templateGroup001['template001.j2'].default.var001.should.equal('val001');
        });
      });

      describe('environment not present in overrides', () => {
        let vars;

        before('getVars', () => {
          vars = variables.getVariables(['application007']);
        });

        it('should have correct template info', () => {
          const appVars = vars.allApplicationsByName.application007;
          appVars.templates.templateGroup001['template001.j2'].default.var001.should.equal('val001');
        });
      });

      describe('environments not present', () => {
        let vars;

        before('getVars', () => {
          vars = variables.getVariables(['application008']);
        });

        it('should have correct template info', () => {
          const appVars = vars.allApplicationsByName.application008;
          appVars.templates.templateGroup001['template001.j2'].default.var001.should.equal('val001');
        });
      });
    });
  });
});