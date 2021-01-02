# Resources
Resources are what we call the YAML files in the `input` directory.
There are 3 types of resources: `application`, `container` and `environment`.
Each contains variables used to render the templates.

## Which resource to use when storing variables
Any variable can go in the application resource, but it is far more useful
in a container or an environment. Containers and environments contain variables
common across that type of container or that particular environment.

## Example
Let's say you have a nodejs application named niftyApp running in the us-east-1
region. In this case, niftyApp is your application, nodejs is the container and 
us-east-1 is the environment.
