# Welcome to Templatic

Templatic is a tool I built for a previous employer that I rebuilt so that I can use it on other projects.
When you have 40+ microservices, you quickly realize there's a lot of duplicated code between kubernetes documents,
CI/CD pipelines, container repositories and many more services. This redundant code quickly leads to drift where
some configurations are newer than others. This tool lets you represent only the differences between your microservices
or applications in YAML and the common parts in a template.

## Getting Started
1. Create a new folder
2. cd into that folder
3. `npx templatic init .`

