# Templatic Inheritance
To keep things simple, the variables used to populate a template generally do not override each other.
Top level variables include `application(s)`, `environment(s)` `container(s)`. Each of these exists independent of
each other.

Applications are unique in that they can limit the environments and containers for which they are rendered.
If a variable is defined both in the `application` and in the `environment` or `container`, then the version
in the application takes precedence.

Variables defined in the `templates` section for a resource get populated as the `template` property of that resource.
The same inheritance applies to the `template` property as for other properties.
