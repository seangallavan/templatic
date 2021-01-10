'use strict';

require('chai').should();
const data = require('../../lib/data');
const scope = require('../../lib/scope');


describe('lib/scope', () => {
  let result;

  before('load template variables', () => {
    data.setDataPath(__dirname + '/../data');
  });

  describe('no options', () => {
    const intended = {
      applications: ['application001', 'application002'],
      environments: ['environment001', 'environment002'],
      templateGroups: ['templateGroup001'],
      containers: ['container001', 'container002'],
      templateNames: undefined,
    }

    before('get scope', () => {
      result = scope.getScope({})
    });

    it('should contain everything', () => {
      result.should.eql(intended);
    });
  });

  describe('some options', () => {
    const argv = {
      appNames: 'application001,application002',
      envNames: 'environment001',
      templateGroups: 'templateGroup001',
      containers: 'container001,container002',
      templateNames: undefined,
    };

    const intended = {
      applications: ['application001', 'application002'],
      environments: ['environment001'],
      templateGroups: ['templateGroup001'],
      containers: ['container001', 'container002'],
      templateNames: undefined,
    };

    before('get scope', () => {
      result = scope.getScope(argv);
    });

    it('should contain everything', () => {
      result.should.eql(intended);
    });
  });

  describe('template specified', () => {
    const argv = {
      appNames: 'application001,application002',
      envNames: 'environment001',
      templateGroups: 'templateGroup001',
      containers: 'container001,container002',
      templateNames: 'template001.txt',
    };
    const intended = {
      applications: ['application001', 'application002'],
      environments: ['environment001'],
      templateGroups: ['templateGroup001'],
      containers: ['container001', 'container002'],
      templateNames: ['template001.txt'],
    }

    before('get scope', () => {
      result = scope.getScope(argv)
    });

    it('should contain everything', () => {
      result.should.eql(intended);
    });
  });

});
