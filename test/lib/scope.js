'use strict';

require('chai').should();
const data = require('../../lib/data');
const scope = require('../../lib/scope');


describe('lib/scope', () => {
  let result;

  before('load template variables', () => {
    data.setDataPath(__dirname + '/../data');
  });

  describe('template specified', () => {
    const argv = {
      templatePaths: 'templateGroup001/template001.txt.j2',
    };
    const intended = {
      applications: ['application001', 'application002'],
      environments: ['environment001', 'environment002'],
      containers: ['container001', 'container002'],
      templates: ['templateGroup001/template001.txt.j2'],
    }

    before('get scope', () => {
      result = scope.getScope(argv)
    });

    it('should contain everything', () => {
      result.should.eql(intended);
    });
  });

  describe('template group', () => {
    const argv = {
      templatePaths: 'templateGroup001/*',
    };
    const intended = {
      applications: ['application001', 'application002'],
      environments: ['environment001', 'environment002'],
      containers: ['container001', 'container002'],
      templates: ['templateGroup001/template001.txt.j2'],
    }

    before('get scope', () => {
      result = scope.getScope(argv)
    });

    it('should contain everything', () => {
      result.should.eql(intended);
    });
  });

  describe('template group, template glob specified', () => {
    const argv = {
      templatePaths: 'templateGroup001/*.txt.j2',
    };
    const intended = {
      applications: ['application001', 'application002'],
      environments: ['environment001', 'environment002'],
      containers: ['container001', 'container002'],
      templates: ['templateGroup001/template001.txt.j2'],
    }

    before('get scope', () => {
      result = scope.getScope(argv)
    });

    it('should contain everything', () => {
      result.should.eql(intended);
    });
  });

  describe('template and template group globs', () => {
    const argv = {
      templatePaths: 'templateGroup*/*.txt*',
    };
    const intended = {
      applications: ['application001', 'application002'],
      environments: ['environment001', 'environment002'],
      containers: ['container001', 'container002'],
      templates: ['templateGroup001/template001.txt.j2', 'templateGroup003/not-a-template.txt'],
    }

    before('get scope', () => {
      result = scope.getScope(argv)
    });

    it('should contain everything', () => {
      result.should.eql(intended);
    });
  });

  describe('templates in subdirs', () => {
    const argv = {
      templatePaths: 'templateGroup002/**',
    };
    const intended = {
      applications: ['application001', 'application002'],
      environments: ['environment001', 'environment002'],
      containers: ['container001', 'container002'],
      templates: ['templateGroup002/subdir1/subdir1a/template1a.txt.j2',
        'templateGroup002/subdir1/template1.txt.j2',
        'templateGroup002/subdir2/template2.txt.j2'
      ],
    }

    before('get scope', () => {
      result = scope.getScope(argv)
    });

    it('should contain everything', () => {
      result.should.eql(intended);
    });
  });

});
