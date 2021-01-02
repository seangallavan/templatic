# The Application Resource
The resources found in `input/applications` represent an application. 
In kubernetes, this would be a deployment. 

## Example
`./input/applications/app1.yml`:
```
name: app1  ### 1
inherits: baseapp  ### 2
variable1: value1  ### 3
containers:  ### 4
  - name: nodejs  ### 5
    containerVariable1: value2  ### 6
  - name: vault  ### 7
environments:  ### 8
  - name: dev  ### 9
    variableForDevEnvironment: value3  ### 10
```

`./input/applications/baseapp.yml`:
```
name: baseapp  ### 11
variable1: value1baase  ### 12
containers:  ### 13
  - name: nodejs  ### 14
    containerVariable1: value2base  ### 15
  - name: dind  ### 16
```

### Explanation
1. Every resource must have a name property
2. One resource can inherit values from another
3. Applications can have variables
4. You can limit the containers rendered
5. Containers must be identified by name
6. Values in the `containers` section override values from a `container` resource
7. Another container to render, this time without variables
8. Like `containers`, you can specify the environments you wish to render
9. Environments must be rendered by name
10. Variables in the `environments` section override variables in `application` YAML 
11. The name of the parent application; this gets overriden by the child
12. This variable is overridden by the child
13. Because this is an array, 