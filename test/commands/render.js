'use strict';

const {execSync} = require('child_process');
const fs = require('fs-extra');
require('chai').should();

const data = require('../../lib/data');

describe('commands/render', () => {
  describe('basic', () => {
    let generated;

    before('set data path', () => {
      data.setDataPath(__dirname + '/../data');
    });

    before('clear old data', () => {
      fs.removeSync(`${data.getDataPath()}/output`);
      fs.ensureDirSync(`${data.getDataPath()}/output`);
    });

    before('render', () => {
      execSync(`${__dirname}/../../cli.sh render -a application001 -d test/data templateGroup001/*`);
    });

    before('get generated', () => {
      generated = fs.readFileSync(`${data.getDataPath()}/output/templateGroup001/application001/environment001/template001.txt`, {encoding: 'utf8'});
    });

    it('should generate correctly', () => {
      generated.should.equal('application001');
    });

    it('should not have rendered application002', () => {
      fs.existsSync(`${__dirname}/../data/output/templateGroup001/application002`).should.be.false;
    });

    it('should render only one environment', () => {
      fs.existsSync(`${__dirname}/../data/output/templateGroup001/application001/environment002`).should.be.false;
    });
  });
});
