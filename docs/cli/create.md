# Create Command
`create <resourceType> <resourceName> [args...]`

This command creates resources. See detailed information about each 
resource type below.


## Create Application Command
`create application <applicationName>`

This is used to create a YAML file in your applications folder for a type of
application (i.e., myNiftyApp). 

## Create Container Command
`create container <containerName>`

This is used to create a YAML file in your containers folder for a type of
container (i.e., nodejs). 

## Create Environment Command
`create environment <containerName>`

This is used to create a YAML file in your environments folder for a type of
environment (i.e., us-east-1). 

## Create Template Command
`create template <templateGroup>/<templateName>`

This is used to create a YAML file in your templates folder for a type of
template (i.e., nodejs). If the template group does not exist, it will be created.
