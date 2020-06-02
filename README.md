#Templatic
##Overview
Templatic is a templating environment specifically for DevOps where multiple
services share configuration details. It takes input YAML files as well as Nunjucks templates to generate
rendered output for systems configuration. The examples provided are for a NodeJS suite
of applications but Templatic is suitable for any CI/CD pipeline, Kubernetes install, etc.

##Example folder
While the documentation is pretty limited, the `example/data` folder should give you a good hint about how
to structure your project. 

##Concepts
There are four different input types: application, container, environment and template. The first three get combined into
one variable object used to render each template. 

##Usage
###Install templatic
From within the root of your node application, install Templatic:

`npm i templatic` -- not yet published on npm, but soon!

##Directory Structure
```.
├── input
│   └── applications
│       └── app001.yml
│   └── containers
│       └── container001.yml.j2
│   └── environments
│       └── env001.yml
│   └── templates
│       └── TemplateGroup001
│           └── template001.j2
│           └── metadata.yml
│   └── vars.yml
├── output
```

##Types of Input Files
###Applications
Applications correspond 1:1 to Kubernetes deployments. As with a Kubernetes Pod, applications can contain multiple 
containers. The only requirement in the YAML is an array of container types, although setting a `name` property is 
recommended. 

###Containers
You should have a YAML file per type of container. The example uses containers for NodeJS, Nginx and static websites.

###Environments
Some things are specific to an environment. An envionment could be dev/stage/prod or an AWS Region. Environments can inherit
from one another.

###Templates
The `tempaltes` directory contains folders for each `Template Group`. Within each `Template Group` are a number of templates
in Nunjucks format (basically the same as Jinja2). There is also a `metadata.yml` file which specifies the output hierarchy,
the executable tempates and possible future data.

###vars.yml
This file contains global variables for your system. These are variables that span all environments, applications and containers.


