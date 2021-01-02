# Templatic Templates
Templates use the Jinja2 format (actually, Nunjucks, but they're basically the same).
The render vars used to render the template can be found in the `renderVars` folder
inside the template group's output directory.

## Template Groups
Templates are organized into groups. Every template in a group must have the
same output hierarchy (see below). 

## Metadata.yml
Every template group is required to have a metadata.yml file. It contains various
pieces of metadata about the templates.

### outputHierarchy
This contains an array of resource types used to organize the output. For example:
```yaml
outputHierarchy:
  - application
  - environment
```

In this example, in the template group's output directory contains folders for
each application which contain folders for each environment. Within these environment
folders, the rendered template is stored along with a `renderVars` directory
containing the variables used to render each template.