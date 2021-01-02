'use strict';

require('chai').should();

const variables = require('../../../lib/variables');

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
});