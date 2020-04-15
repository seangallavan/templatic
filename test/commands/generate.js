'use strict';

const {execSync} = require('child_process');
const fs = require('fs');
const should = require('chai').should();

const data = require('../../lib/data');

describe('commands/generate', () => {
  describe('basic', () => {
    let generated;

    before('generate', () => {
      execSync(`${__dirname}/../../cli generate -a application001 -d ${__dirname}/../data`);
    });

    before('get generated', () => {
      generated = fs.readFileSync(`${data.getDataPath()}/output/templateGroup001/application001/environment001/template001`, {encoding: 'utf8'});
    });

    it('should generate correctly', () => {
      generated.should.equal('application001');
    });
  });
});