# Getting Started

1. Install Templatic

    `npm i --save-dev templatic`
   
2. Build Project

    `templatic create project <projectName>`
    
3. Create your template group and template

    `templatic create template <templateGroup> <templateName>`
    
4. Create your YAML files

    `templatic create application <applicationName>`
    
    `templatic create environment <environmentName>`
    
    `templatic create container <containerName>`
    
5. Replace parts of template that differ by service with variables and add them to the appropriate YAML files

6. Render the templates

    `templatic render`