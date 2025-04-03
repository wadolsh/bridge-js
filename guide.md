# Bridge-js Component Engine Guide

The Bridge-js Component Engine is a JavaScript framework for creating web applications with a focus on reusable components. It provides a template-based system that allows you to create, combine, and reuse UI components efficiently.

## Table of Contents
1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Creating Templates](#creating-templates)
4. [Creating Components](#creating-components)
5. [Template Syntax](#template-syntax)
   - [Basic Expressions](#basic-expressions)
   - [HTML Element Expressions](#html-element-expressions)
   - [Built-in Variables](#built-in-variables)
6. [Examples](#examples)
7. [Advanced Usage](#advanced-usage)

## Introduction

Bridge-js is designed to support:
- Single Page Applications (SPA)
- Reusable component creation
- Integration of styles, HTML, and JavaScript logic in a single template
- Event handling in HTML tags
- Component composition for building complex UIs

## Installation

To use Bridge-js, include the bridge.template.js script in your HTML file:

```html
<script src="js/bridge.template.js"></script>
```

## Creating Templates

There are two main ways to create templates in Bridge-js:

### Method 1: Using bridge.tmplTool.addTmpl()

```javascript
bridge.tmplTool.addTmpl('do-Simple', '<div>##=data.label##</div>');
```

### Method 2: Using template tags with bridge.tmplTool.addTmpls()

```javascript
var templateString = `
  <template id="do-Simple-One">
    <div class="do-Simple-One">
      ##=data.label##
    </div>
  </template>

  <template id="do-Simple-Two">
    <style id="style-do-Simple-Two">
      .do-Simple-Two {
        background-color: yellow;
      }
    </style>
    <div class="do-Simple-Two">
      ##=data.label##
    </div>
  </template>
`;

bridge.tmplTool.addTmpls(templateString);
```

When using the template tag approach:
- The ID attribute determines the component name
- Styles defined within the template are added to the document head
- Style tag IDs should follow the format "style-{template-id}" to prevent conflicts

## Creating Components

Once templates are defined, you can create components and add them to the DOM:

### Method 1: Using the tmpl namespace

```javascript
var sample = tmpl.do.SimpleSample({label: 'Div Simple'});
document.body.appendChild(sample.element);
```

### Method 2: Using bridge.tmpl() function

```javascript
var sample = bridge.tmpl('do-Simple-Sample')({label: 'Div Simple'});
document.body.appendChild(sample.element);
```

The data you pass (like `{label: 'Div Simple'}`) is available inside the template as the `data` object.

## Template Syntax

Bridge-js uses a special syntax for template expressions and data binding.

### Basic Expressions

#### `##= ##` - Output expression
Outputs string content. HTML tags will be treated as HTML.

```html
<div>##='Sample Text'##</div>
<div>##=data.label##</div>
<div style="background-color: ##=data.bgColor || 'gray'##;">##=data.text##</div>
```

If a function is specified, its result will be output.

#### `##- ##` - HTML-escaped output expression
Outputs string content with HTML escape processing. This prevents HTML tags from being interpreted.

```html
<div>##-'<div>Sample Text</div>'##</div> <!-- Will show the actual HTML tags -->
<div>##-data.label##</div>
```

#### `##% ##` - Component output expression
Used to include other components, HTML elements, or strings.

```html
<div>##%tmpl.another.Component({prop: 'value'})##</div>
<div>##%[comp1, comp2, comp3]##</div> <!-- Array of components -->
```

#### `## ##` - JavaScript code block
Allows you to write JavaScript code directly within templates.

```html
<template id="my-component">
  ##
    var count = data.count || 0;
    var displayText = 'Count: ' + count;
    
    function incrementCount() {
      count++;
      tmplScope.refresh({count: count});
    }
    
    tmplScope.increment = incrementCount;
  ##
  
  <div>##=displayText##</div>
  <button data-bridge-event="click: tmplScope.increment">Increment</button>
</template>
```

#### `### ##` - Style expression
Used to define style content.

#### `##! ##` - Comment
Used for adding comments in the template that won't be rendered.

### HTML Element Expressions

#### `data-bridge-event="##:{eventType: handler}##"`
Attaches event handlers to HTML elements. Multiple events can be specified by separating them with semicolons.

```html
<button data-bridge-event="##:{click: handleClick}##">Click Me</button>
<input data-bridge-event="##:{focus: onFocus; blur: onBlur; input: onChange}##" />
```

You can also pass parameters to event handlers:

```html
<button data-bridge-event="##:{click: handleClick('param1', 'param2')}##">Click Me</button>
```

#### `data-bridge-load="handler"`
Specifies a function to run when the element is loaded.

#### `data-bridge-scope-key="key: value"`
Sets properties on the template scope.

#### `data-bridge-var="var: value"`
Binds a variable to an element.

### Built-in Variables

These variables are available within templates:

#### `data`
Contains the data passed when creating the component.

#### `status`
Object for storing state information.

#### `i18n`
Internationalization object.

#### `tmplScope`
Reference to the template scope, which contains:
- `appendTo`: Function to append the component to an element
- `data`: The component's data
- `element`: The component's DOM element
- `refresh`: Function to update the component
- `remove`: Function to remove the component
- `render`: Function to render the component
- `replace`: Function to replace the component
- `status`: The component's status
- `tmplId`: The template ID
- `_id`: The component's unique ID

## Examples

### Basic Component

```javascript
// Define template
bridge.tmplTool.addTmpl('example-Counter', `
  <div>
    ##
      var count = data.initialCount || 0;
      
      tmplScope.increment = function() {
        count++;
        tmplScope.refresh({count: count});
      };
    ##
    <div>Count: ##=count##</div>
    <button data-bridge-event="##:{click: tmplScope.increment}##">+</button>
  </div>
`);

// Create and use component
var counter = tmpl.example.Counter({initialCount: 5});
document.body.appendChild(counter.element);
```

### Component Composition

```javascript
// Define templates
bridge.tmplTool.addTmpls(`
  <template id="ui-Button">
    <style id="style-ui-Button">
      .ui-Button {
        padding: 8px 16px;
        background-color: #0078d7;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      .ui-Button:hover {
        background-color: #106ebe;
      }
    </style>
    <button class="ui-Button" data-bridge-event="##:{click: data.onClick}##">##=data.label##</button>
  </template>

  <template id="ui-Form">
    <style id="style-ui-Form">
      .ui-Form {
        padding: 16px;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
      .ui-Form-title {
        font-size: 18px;
        margin-bottom: 16px;
      }
    </style>
    <div class="ui-Form">
      <div class="ui-Form-title">##=data.title##</div>
      <div>##%data.content##</div>
    </div>
  </template>
`);

// Create Form with Button
var button = tmpl.ui.Button({
  label: 'Submit',
  onClick: function() { alert('Form submitted!'); }
});

var form = tmpl.ui.Form({
  title: 'Contact Form',
  content: button
});

document.body.appendChild(form.element);
```

## Advanced Usage

### Lazy Loading Templates

You can load templates from external files:

```javascript
bridge.tmplTool.addTmplByUrl([
  'template/components.html',
  'template/layout.html'
], function() {
  // Templates are now loaded and ready to use
  var app = tmpl.app.Main({});
  document.body.appendChild(app.element);
});
```

### Handling Component State

Bridge-js components can maintain and update their state:

```javascript
var counter = tmpl.app.Counter({initialCount: 0});
document.body.appendChild(counter.element);

// Later, update the counter's state
counter.refresh({initialCount: 10});
```

### Internationalization

```javascript
bridge.tmplTool.addI18n('greeting', {
  'en': 'Hello',
  'es': 'Hola',
  'fr': 'Bonjour'
});

bridge.tmplTool.addTmpl('app-Greeting', `
  <div>##=i18n.greeting## ##=data.name##!</div>
`);

var greeting = tmpl.app.Greeting({name: 'World'});
document.body.appendChild(greeting.element);
```

This guide provides a comprehensive introduction to the Bridge-js Component Engine. For more detailed information, refer to the official documentation or explore the provided sample code.

For more detailed information, check out the [documentation](https://wadolsh.github.io/bridge-js/).
