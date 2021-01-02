'use strict';

require('chai').should();
const data = require('../../../lib/data');
const variables = require('../../../lib/variables');


describe('lib/variables/getGlobalVariables', () => {
    let vars;

    before('load variables', () => {
        data.setDataPath(__dirname + '/../../data');
        vars = variables.getGlobalVars();
    });

    describe('global vars', () => {
        it('should have correct value', () => {
            vars.globals.globalVar1.should.equal('globalVal1');
        });
    });

    describe('application vars', () => {
        it('should have correct application values', () => {
            vars.allApplications[0].appVar1.should.equal('appVal1');
            vars.allApplications[1].appVar1.should.equal('appVal2');
            vars.allApplicationsByName.application001.appVar1.should.equal('appVal1');
            vars.allApplicationsByName.application002.appVar1.should.equal('appVal2');
        });

         it('should have correct container values', () => {
            vars.allApplicationsByName.application001.containers.should.exist;
            vars.allApplicationsByName.application001.containersByName.should.exist;
            vars.allApplicationsByName.application001.containers.length.should.equal(1);
            Object.keys(vars.allApplicationsByName.application001.containersByName).length.should.equal(1);
            vars.allApplicationsByName.application001.containersByName.container001.name.should.equal('container001');
            vars.allApplicationsByName.application001.containersByName.container001.cvar1.should.equal('cval1');
            vars.allApplicationsByName.application001.containersByName.container001.templates.should.exist;
            vars.allApplicationsByName.application001.containersByName.container001.templates.templateGroup001["template001.txt"].cVar3.should.equal('cVal2');
        });

         it('should have correct environment values', () => {
            vars.allApplicationsByName.application001.environments.should.exist;
            vars.allApplicationsByName.application001.environmentsByName.should.exist;
            vars.allApplicationsByName.application001.environments.length.should.equal(1);
            Object.keys(vars.allApplicationsByName.application001.environmentsByName).length.should.equal(1);
            vars.allApplicationsByName.application001.environmentsByName.environment001.name.should.equal('environment001');
            vars.allApplicationsByName.application001.environmentsByName.environment001.evar1.should.equal('eval1');
            vars.allApplicationsByName.application001.environmentsByName.environment001.environmentVar1.should.equal('environmentVal2');
        });
    });

    describe('environment vars', () => {
        it('should have correct values', () => {
            vars.allEnvironments[0].environmentVar1.should.equal('environmentVal1');
            vars.allEnvironments[1].environmentVar1.should.equal('environmentVal2');
            vars.allEnvironmentsByName.environment001.environmentVar1.should.equal('environmentVal1');
            vars.allEnvironmentsByName.environment002.environmentVar1.should.equal('environmentVal2');
            vars.allEnvironmentsByName.environment001.name.should.equal('environment001');
        });
    });

    describe('container vars', () => {
        it('should have correct values', () => {
            vars.allContainers[0].containerVar1.should.equal('containerVal1');
            vars.allContainers[1].containerVar1.should.equal('containerVal2');
            vars.allContainersByName.container001.containerVar1.should.equal('containerVal1');
            vars.allContainersByName.container002.containerVar1.should.equal('containerVal2');
            vars.allContainersByName.container001.name.should.equal('container001');
            vars.allContainersByName.container001.containerVar1.should.equal('containerVal1');
            vars.allContainersByName.container001.cvar1.should.equal('cval2');
            vars.allContainersByName.container001.templates.should.exist;
            vars.allContainersByName.container001.templates.templateGroup001["template001.txt"].cVar3.should.equal('cVal3');
        });
    });
});
