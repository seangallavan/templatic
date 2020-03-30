'use strict';

const yaml = require('js-yaml');
const should = require('chai').should();
const fs = require('fs');

const render = require('../../lib/render');

describe('lib/render.js', () => {
  describe('uniqueByName', () => {

  });

  describe('mergeObjectsConcatArrays', () => {
    const moca = render.testing.mergeObjectsConcatArrays;

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

  describe('getVariables', () => {
    describe('basic', () => {
      let vars;

      before('getVars', () => {
        vars = render.getVariables('application001', 'environment001');
      });

      it('should have correct application info', () => {
        vars.name.should.equal('application001');
        vars.global001.should.equal('value001');
        vars.region.should.equal('region001');
        vars.hasContainer.container001.should.be.true;
        vars.containers.length.should.equal(1);
        vars.containers[0].name.should.equal('application001-container001');
      });
    });

    describe('with templates', () => {
      describe('all fields provided', () => {
        let vars;

        before('getVars', () => {
          vars = render.getVariables('application002', 'environment001');
        });

        it('should have correct template info', () => {
          vars.templates.templateGroup001['template001.j2'].var001.should.equal('val003');
        });
      });

      describe('empty default field', () => {
        let vars;

        before('getVars', () => {
          vars = render.getVariables('application004', 'environment001');
        });

        it('should have correct template info', () => {
          vars.templates.templateGroup001['template001.j2'].var001.should.equal('val003');
        });
      });

      describe('no default field', () => {
        let vars;

        before('getVars', () => {
          vars = render.getVariables('application005', 'environment001');
        });

        it('should have correct template info', () => {
          vars.templates.templateGroup001['template001.j2'].var001.should.equal('val003');
        });
      });

      describe('env override present but empty', () => {
        let vars;

        before('getVars', () => {
          vars = render.getVariables('application006', 'environment001');
        });

        it('should have correct template info', () => {
          vars.templates.templateGroup001['template001.j2'].var001.should.equal('val001');
        });
      });

      describe('environment not present in overrides', () => {
        let vars;

        before('getVars', () => {
          vars = render.getVariables('application007', 'environment001');
        });

        it('should have correct template info', () => {
          vars.templates.templateGroup001['template001.j2'].var001.should.equal('val001');
        });
      });

      describe('environmentOverrides not present', () => {
        let vars;

        before('getVars', () => {
          vars = render.getVariables('application008', 'environment001');
        });

        it('should have correct template info', () => {
          vars.templates.templateGroup001['template001.j2'].var001.should.equal('val001');
        });
      });
    });
  });

  describe('getTemplateRenderVars', () => {
    describe('main template vars', () => {
      let templateRenderVars;

      before('getVars', () => {
        const vars = render.getVariables('application008', 'environment001');
        templateRenderVars = render.testing.getTemplateRenderVars('templateGroup001', 'template001.j2', vars);
      });

      it('should have template property', () => {
        templateRenderVars.template.var001.should.equal('val001');
      });
    });

    describe('container template vars', () => {
      let templateRenderVars;

      before('getVars', () => {
        const vars = render.getVariables('application009', 'environment001');
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
        const vars = render.getVariables('application001', 'environment001');
        rendered = render.renderTemplate('templateGroup001', 'template001.j2', vars);
      });

      it('should render correctly', () => {
        rendered.should.equal('application001');
      });
    });

  });

  describe('containers', () => {
    let vars;

    before('getVars', () => {
      vars = render.getVariables('application003', 'environment001');
    });

    it('should have correct container template info', () => {
      vars.containers[0].templates.templateGroup001['template001.j2'].var001.should.equal('val003');
    });
  });
});