'use strict';

const {execSync} = require('child_process');
const fs = require('fs');
const should = require('chai').should();

const config = require('../../../config');

describe.skip('commands/generate/application', () => {
  describe('basic', () => {
    let generated;

    before('generate', () => {
      execSync(`node run.js generate application application001 -d ${__dirname}/../../data`);
    });

    before('get generated', () => {
      generated = fs.readFileSync(`${config.get('dataRepo:path')}/output/applications/application001/environment001/templateGroup001/template001`, {encoding: 'utf8'});
    });

    it('should generate correctly', () => {
      generated.should.equal('application001');
    });
  });
});