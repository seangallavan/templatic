'use strict';

const _ = require('lodash');
const should = require('chai').should();
const sinon = require('sinon');

const variables = require('../../lib/variables');
const enrich = require('../../lib/enrich');
const data = require('../../lib/data');

describe('lib/enrich.js', () => {
  describe('enrichRenderVarsWithRenderedContainerVars', () => {
    const templateVars = {
      allContainerTemplatesByName: {
        container001: "name: {{ name }}-container001",
        container002: "name: {{ name }}-container002\n\ntemplates:\n  templateGroup001:\n    template001.j2:\n      default:\n        var001: val001\n      environments:\n        environment001:\n          var001: val003",
      },
      renderVars: {},
      temporaryVars: {
        name: 'applicationName',
      },
    };

    before('enrich', () => {
      enrich.testing.enrichRenderVarsWithRenderedContainerVars(templateVars);
    });

    it('should render template correctly', () => {
      templateVars.renderVars.allContainers.should.exist;
      templateVars.renderVars.allContainers.length.should.equal(2);
      templateVars.renderVars.allContainers[0].name.should.equal('applicationName-container001');

      templateVars.renderVars.allContainersByName.should.exist;
      Object.keys(templateVars.renderVars.allContainersByName).length.should.equal(2);
      Object.values(templateVars.renderVars.allContainersByName)[0].name.should.equal('applicationName-container001');
    });
  });

  describe('enrichRenderVarsWithCollectionOfAllInputTypes', () => {
    const templateVars = {
      allApplications: [
        {
          name: 'applicationName',
        }
      ],
      allEnvironments: [
        {
          env: 'env001',
        },
        {
          env: 'env002',
        }
      ],
      containers: [
        {
          var1: 'val1',
        }
      ],

      allApplicationsByName: {
        applicationName: {
          name: 'applicationName',
        },
      },
      allEnvironmentsByName: {
        environment001: {
          env: 'env001',
        },
        environment002: {
          env: 'env002',
        },
      },
      allContainerTemplatesByName: {
        container001: "name: {{ name }}-container001",
        container002: "name: {{ name }}-container002\n\ntemplates:\n  templateGroup001:\n    template001.j2:\n      default:\n        var001: val001\n      environments:\n        environment001:\n          var001: val003",
      },
      renderVars: {},
      temporaryVars: {
        name: 'applicationName',
      },
    };

    before('enrich', () => {
      enrich.testing.enrichRenderVarsWithCollectionOfAllInputTypes(templateVars);
    });

    describe('applications', () => {
      it('should enrich properly', () => {
        templateVars.renderVars.allApplications.should.exist;
        templateVars.renderVars.allApplications.length.should.equal(1);
        templateVars.renderVars.allApplications[0].name.should.equal('applicationName');

        templateVars.renderVars.allApplicationsByName.should.exist;
        Object.keys(templateVars.renderVars.allApplicationsByName).length.should.equal(1);
        Object.values(templateVars.renderVars.allApplicationsByName)[0].name.should.equal('applicationName');
      });
    });

    describe('environments', () => {
      it('should enrich properly', () => {
        templateVars.renderVars.allEnvironments.should.exist;
        templateVars.renderVars.allEnvironments.length.should.equal(2);
        templateVars.renderVars.allEnvironments[0].env.should.equal('env001');

        templateVars.renderVars.allEnvironmentsByName.should.exist;
        Object.keys(templateVars.renderVars.allEnvironmentsByName).length.should.equal(2);
        Object.values(templateVars.renderVars.allEnvironmentsByName)[0].env.should.equal('env001');
      });
    });

    describe('containers', () => {
      it('should enrich properly', () => {
        templateVars.renderVars.allContainers.should.exist;
        templateVars.renderVars.allContainers.length.should.equal(2);
        templateVars.renderVars.allContainers[0].name.should.equal('applicationName-container001');

        templateVars.renderVars.allContainersByName.should.exist;
        Object.keys(templateVars.renderVars.allContainersByName).length.should.equal(2);
        Object.values(templateVars.renderVars.allContainersByName)[0].name.should.equal('applicationName-container001');
      });
    });
  });

  describe('enrichRenderVarsWithCollectionOfUsedInputTypes', () => {
    const templateVars = {
      allContainerTemplatesByName: {
        container001: "name: {{ name }}-container001",
        container002: "name: {{ name }}-container002\n\ntemplates:\n  templateGroup001:\n    template001.j2:\n      default:\n        var001: val001\n      environments:\n        environment001:\n          var001: val003",
      },
      renderVars: {
        allApplications: [
          { name: 'applicationName' }
        ],
        allApplicationsByName: {
          applicationName: {
            name: 'applicationName',
          },
        },
        allEnvironments: [
          { env: 'env001' }
        ],
        allEnvironmentsByName: {
          environment001: {
            env: 'env001',
          },
        },
        allContainers: [
          { name: 'applicationName-container001' }
        ],
        allContainersByName: {
          container001: {
            name: 'applicationName-container001',
          },
        },
      },
    };

    const directoryHierarchy = ['application'];

    before('enrich', () => {
      enrich.testing.enrichRenderVarsWithCollectionOfUsedInputTypes(templateVars, directoryHierarchy);
    });

    describe('applications', () => {
      it('should enrich properly', () => {
        should.not.exist(templateVars.renderVars.applications);
        should.not.exist(templateVars.renderVars.applicationsByName);
      });
    });

    describe('environments', () => {
      it('should enrich properly', () => {
        templateVars.renderVars.environments.should.exist;
        templateVars.renderVars.environments.length.should.equal(1);
        templateVars.renderVars.environments[0].env.should.equal('env001');

        templateVars.renderVars.environmentsByName.should.exist;
        Object.keys(templateVars.renderVars.environmentsByName).length.should.equal(1);
        templateVars.renderVars.environmentsByName.environment001.env.should.equal('env001');
      });
    });

    describe('containers', () => {
      it('should enrich properly', () => {
        templateVars.renderVars.allContainers.should.exist;
        templateVars.renderVars.allContainers.length.should.equal(1);
        templateVars.renderVars.allContainers[0].name.should.equal('applicationName-container001');

        templateVars.renderVars.allContainersByName.should.exist;
        Object.keys(templateVars.renderVars.allContainersByName).length.should.equal(1);
        templateVars.renderVars.allContainersByName.container001.name.should.equal('applicationName-container001');
      });
    });
  });

  describe('enrichRenderVarsWithMergedVariables', () => {
    const templateVars = {
      renderVars: {
        allApplicationsByName: {
          applicationName: {
            name: 'applicationName',
          }
        },
        allEnvironmentsByName: {
          environment001: {
            env: 'env001',
          }
        },
        allContainersByName: {
          container001: {
            name: 'applicationName-container001',
          }
        },
      },
    };
    const directoryHierarchy = ['application', 'environment'];
    const scope = {
      applications: [
        'applicationName'
      ],
      environments: [
        'environment001'
      ],
      containers: [
        'container001'
      ],
    };

    before('enrich', () => {
      enrich.testing.enrichRenderVarsWithMergedVariables(templateVars, directoryHierarchy, scope);
    });

    it('should enrich properly', () => {
      templateVars.renderVars.name.should.equal('applicationName');
      templateVars.renderVars.env.should.equal('env001');
    });
  });

  describe('enrichRenderVarsWithTemplateProperty', () => {
    const templateVars = {
      renderVars: {
        allApplicationsByName: {
          applicationName: {
            templates: {
              templateGroup001: {
                'template001.j2': {
                  default: {
                    var001: 'val001',
                  },
                },
              },
            },
          },
        },
        allEnvironmentsByName: {
          environment001: {
            templates: {
              templateGroup001: {
                'template001.j2': {
                  default: {
                    var002: 'val002',
                  },
                },
              },
            },
          },
        },
        allContainersByName: {
          container001: {
            templates: {
              templateGroup001: {
                'template001.j2': {
                  default: {
                    var003: 'val003',
                  },
                },
              },
            },
          },
        },
        templates: {
          templateGroup001: {
            'template001.j2': {
              var004: 'val004',
            },
          },
        },
      },
    };
    const templateGroup = 'templateGroup001';
    const templateName = 'template001.j2';

    before('enrich', () => {
      enrich.testing.enrichRenderVarsWithTemplateProperty(templateVars, templateGroup, templateName);
    });

    describe('top level', () => {
      it('should have correct template property', () => {
        templateVars.renderVars.template.var004.should.equal('val004');
      });
    });

    describe('second level', () => {
      it('should have a template property in applications', () => {
        templateVars.renderVars.allApplicationsByName.applicationName.template.should.exist;
        templateVars.renderVars.allApplicationsByName.applicationName.template.var001.should.equal('val001');
      });

      it('should have a template property in environments', () => {
        templateVars.renderVars.allEnvironmentsByName.environment001.template.should.exist;
        templateVars.renderVars.allEnvironmentsByName.environment001.template.var002.should.equal('val002');
      });

      it('should have a template property in containers', () => {
        templateVars.renderVars.allContainersByName.container001.template.should.exist;
        templateVars.renderVars.allContainersByName.container001.template.var003.should.equal('val003');
      });
    });
  });

  describe('getForEnviroment', () => {
    const environment = 'environment001';
    const vars = {
      default: {
        var1: 'val1',
      },
      environment001: {
        var1: 'val2',
      },
    };
    let noEnv;
    let withEnv;

    before('enrich', () => {
      noEnv = enrich.testing.getForEnvironment(vars);
      withEnv = enrich.testing.getForEnvironment(vars, environment);
    });

    it('should have the correct value for no environment', () => {
      noEnv.var1.should.equal('val1');
      withEnv.var1.should.equal('val2');
    });
  });
});