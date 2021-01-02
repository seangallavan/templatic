#Templatic Render Vars
Each template is rendered with an object containing various values
from all of the associated resources. 

```yaml
allApplications:
  - name: metrics
allApplicationsByName:
  metrics:
    name: metrics
allEnvironments:
  - name: dev
    inherits: us-east-1
  - name: prod
    inherits: us-east-1
  - name: stage
    inherits: us-east-1
  - name: test
    inherits: us-east-1
allEnvironmentsByName:
  dev:
    name: dev
    inherits: us-east-1
  prod:
    name: prod
    inherits: us-east-1
  stage:
    name: stage
    inherits: us-east-1
  test:
    name: test
    inherits: us-east-1
allContainers:
  - name: nodejs
allContainersByName:
  nodejs:
    name: nodejs
globals: {}
applications:
  - name: metrics
application: {}
environments:
  - name: dev
    inherits: us-east-1
  - name: prod
    inherits: us-east-1
  - name: stage
    inherits: us-east-1
  - name: test
    inherits: us-east-1
environment: {}
containers:
  - name: nodejs
container: {}
```

## allApplications, allContainers, allEnvironments
Each of these contain an array of all of the resources of that type. 

## allApplicationsByName, allContainersByName, allEnvironmentsByName
Each of these contain an object indexed by the names of resources of that type.

## globals
An object containing all global variables.

# application(s), containers(s), environments(s)
These contain the data specifically rendered for this template.
