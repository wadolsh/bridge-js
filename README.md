# Bridge-js Component Engine Guide

The Bridge-js Component Engine is a lightweight JavaScript framework for creating web applications with a focus on reusable components. It provides a template-based system that allows you to create, combine, and reuse UI components efficiently.

## Table of Contents

1. [Introduction](#introduction)
2. [Key Features](#key-features)
3. [Example Applications](#example-applications)
4. [Installation](#installation)
5. [Basic Usage](#basic-usage)
6. [Template Syntax](#template-syntax)
7. [Advanced Features](#advanced-features)
8. [Template Lifecycle](#template-lifecycle)
9. [API Reference](#api-reference)
10. [Built-in Components](#built-in-components)
11. [Internal Workings](#internal-workings)
12. [Best Practices](#best-practices)
13. [Code Examples](#code-examples)
14. [Documentation](#documentation)
15. [License](#license)


## Introduction

## Key Features
- **SPA Support**: Easy creation of Single Page Applications
- **Lightweight**: Minimal footprint for fast loading and execution.
- **Template-Based**: Use a simple yet powerful string-based template syntax with JavaScript evaluation
- **All-in-One Templates**: Define HTML, CSS, and JavaScript logic in a single template
- **Data Binding**: Easily bind data to your templates.
- **Event Handling**: Easily attach events to HTML elements.
- **Component-Oriented**: Build reusable UI components.
- **Component Composition**: Combine components like building blocks to create complex UIs
- **State Management**: Manage component state efficiently.
- **Internationalization (i18n)**: Support multiple languages.
- **Lazy Loading**: Load templates from external files.
- **Caching**: Automatic template caching for better performance.

## Example Applications

You can find example applications in the examples directory:

- Component Examples [Code](https://github.com/wadolsh/bridge-js/blob/master/examples/sample.html), [Web](https://wadolsh.github.io/bridge-js/examples/sample.html)

- Simple Counter [Code](https://github.com/wadolsh/bridge-js/blob/master/examples/counter.html), [Web](https://wadolsh.github.io/bridge-js/examples/counter.html)
- Todo List [Code](https://github.com/wadolsh/bridge-js/blob/master/examples/todo.html), [Web](https://wadolsh.github.io/bridge-js/examples/todo.html)
- Calculator [Code](https://github.com/wadolsh/bridge-js/blob/master/examples/calculator.html), [Web](https://wadolsh.github.io/bridge-js/examples/calculator.html)



## Installation

Include the bridge.template.js script in your HTML file:

```html
<script src="js/bridge.template.js"></script>
```

Alternatively, you can use the CDN:

```html
<script src="https://wadolsh.github.io/bridge-js/js/bridge.template.js"></script>
```

## Basic Usage

### 1. Define a Template

There are two ways to define templates:

#### Method 1: Using bridge.tmplTool.addTmpl()

```javascript
bridge.tmplTool.addTmpl('do-Simple-Label', '<span>##=data.label##</span>');
```

#### Method 2: Using template tags with bridge.tmplTool.addTmpls()

You can define templates in your HTML using the `<template>` tag:

```javascript
const templateString = `
  <template id="do-Simple-Label">
    <span class="do-Simple-Label">
      ##=data.label##
    </span>
  </template>

  <template id="do-Simple-Button">
    <style id="style-do-Simple-Button">
      .do-Simple-Button {
        background-color: yellow;
      }
    </style>
    <Button class="do-Simple-Button"
        style="color: ##=##=data.color || 'red'##"
        data-bridge-event="##:data.onClick##">
      ##=data.label##
    </Button>
  </template>
`;

bridge.tmplTool.addTmpls(templateString);
```

When using the template tag approach:
- The ID attribute determines the component name
- Styles defined within the template are added to the document head
- Style tag IDs should follow the format "style-{template-id}" to prevent conflicts with other styles


#### Method 3: Loading Templates from HTML

```html
<!DOCTYPE html>
<html>
  <body>
    <template id="do-Simple-Label">
      <span class="do-Simple-Label">
        ##=data.label##
      </span>
    </template>
    <template id="do-Simple-Button">
      <style id="style-do-Simple-Button">
        .do-Simple-Button {
          background-color: yellow;
        }
      </style>
      <Button class="do-Simple-Button"
          style="color: ##=##=data.color || 'red'##"
          data-bridge-event="##:data.onClick##">
        ##=data.label##
      </Button>
    </template>
  </body>
</html>
```

Then load all templates at once:

```javascript
bridge.tmplTool.addTmpls(document.body.innerHTML, true); // removeInnerTemplate: true -> Remove template inside <body>
```

#### Method 4: Template Loading from URL

```javascript
// Load templates from external file
bridge.tmplTool.addTmplByUrl('templates.html', function() {
  console.log('Templates loaded!');
  const mainScreen = tmpl.do.MainScreen({});
  document.body.appendChild(mainScreen.element);
});

// Options for loading
bridge.tmplTool.addTmplByUrl({
  url: 'templates.html',
  option: {
    loadScript: true,  // Load and execute script tags
    loadStyle: true,   // Load style tags
    loadLink: true     // Load link tags
  }
}, callback);

// Load multiple template files
bridge.tmplTool.addTmplByUrl([
  'templates1.html',
  'templates2.html'
], callback);
```

### 2. Create a Component

Once templates are defined, you can create components and add them to the DOM:

**Method 1**: Using the tmpl namespace

```javascript
const sample = tmpl.do.SimpleLabel({label: 'Div Simple'});
document.body.appendChild(sample.element);
```
Output => 

```html
<div class="do-Simple-Label">Div Simple</div>
```

**Method 2**: Using bridge.tmpl() function

```javascript
const sample = bridge.tmpl('do-Simple-Button')({label: 'Div Simple', color: 'blue', onClick: (event) => {
    alert('Button clicked!');
  }});
document.body.appendChild(sample.element);
```

Output => 

```html
<button class="do-Simple-Button" style="color: blue">Div Simple</button>
<!-- Event will be triggered when the button is clicked -->
```

The data you pass (like `{label: 'Div Simple', color: 'blue', onClick: (event) => { alert('Button clicked!'); }}`) is available inside the template as the `data` object.


### 3. Compose Components

Easily combine components to build complex UIs:

```javascript
bridge.tmplTool.addTmpls(`
  <template id="do-Simple-CountUpButton">
    <style id="style-do-Simple-CountUpButton">
      .do-Simple-CountUpButton {
        border: 1px solid #ccc;
        padding: 10px;
        margin-bottom: 10px;
      }
    </style>
    ##
    let count = data.initCount || 0;
    const label = tmpl.do.SimpleLabel({label: 'Count: ' + count});
    const button = tmpl.do.SimpleButton({label: 'Button', color: 'blue', onClick: (event) => {
      count++;
      label.refresh({'Count: ' + count}); // Update the label
    }});
    ##
    <div class="do-Simple-CountUpButton">
      ##%label##
      ##%button##
    </div>
  </template>
`);

// Create a component
const countUpButton = tmpl.do.Simple.CountUpButton({ initCount: 0 });
document.body.appendChild(countUpButton.element);
```

Output => 

```html
<div class="do-Simple-CountUpButton">
  <span class="do-Simple-Label">Count: 0</span>
  <button class="do-Simple-Button" style="color: blue">Button</button>
  <!-- Label will be updated when the button is clicked -->
</div>
```

## Template Syntax

Bridge-js uses a special syntax for template expressions and data binding.

### Style Definitions

```javascript
bridge.tmplTool.addTmpls(`
<template id="ui-Card">
  <style id="style-ui-Card">
    .ui-Card { border: 1px solid #ccc; }
    .ui-Card h3 { color: blue; }
  </style>
  <div id="ui-Card">Card ##=data.num##</div>
</template>
`);
document.body.appendChild(tmpl.ui.Card({num: 1}).element);
document.body.appendChild(tmpl.ui.Card({num: 2}).element);
```
Output =>
```html
<html>
  <head>
    <style id="style-ui-Card">
      .ui-Card { border: 1px solid #ccc; }
      .ui-Card h3 { color: blue; }
    </style>
  </head>
  <body>
    <div id="ui-Card">Card 1</div>
    <div id="ui-Card">Card 2</div>
  </body>
</html>
```

When included in a template, style elements with IDs are automatically extracted and appended to the document head.

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
- `tmplScope.appendTo(element)` - Appends template to element
- `tmplScope.render(data)` - Re-renders with new data
- `tmplScope.refresh(data)` - Updates with partial data
- `tmplScope.remove(spacer)` - Removes from DOM
- `tmplScope.replace(newScope)` - Replaces with another template
- `tmplScope.release()` - Releases template resources
- `tmplScope.element` - Reference to the rendered DOM element
- `tmplScope.data` - The data used to render the template
- `tmplScope.status` - Status object for template state
- `tmplScope._id` - Unique ID for the template instance
- `tmplScope.tmplId` - The template ID

### Basic Expressions

- `##= ##` - Output string content (HTML will be treated as HTML)
- `##- ##` - Output escaped HTML content (HTML tags will be shown as text)
- `##% ##` - Output component or HTML element
- `##! ##` - Code that runs template on loading
- `## ##` - Code that runs template on rendering
- `### ##` - Code that runs after template is rendered
- `#\# #\#` - Comment


#### `##= ##` Data Interpolation

Outputs string content. HTML tags will be treated as HTML.

```javascript
##={property}## => Outputs the value of {property}
```

Example:
```html
<span class="##=data.className || 'bg-blue'##">##=data.userName##</span>
```
Output =>
```html
<!-- data = { userName: 'John Doe' }; -->
<span class="bg-blue">John Doe</span>
```

If `data.userName` is a function, it will be called automatically and its result will be displayed.

```html
<span>##=data.getUserName##</span>
```
Output =>
```html
<!-- data = { getUserName = () => 'John Doe' }; -->
<span>John Doe</span>
```

#### `##- ##` HTML Escaping

```
##-{property}## - Outputs the escaped value of {property}
```

Example:
```html
<div>##-data.htmlContent##</div>
```
=>
```html
<!-- data = { htmlContent: '<div>Sample Text</div>' }; -->
<div>&lt;div&gt;Sample Text&lt;/div&gt;</div>
```

This prevents XSS attacks by escaping HTML characters.


#### `##% ##` Element Insertion

Used to include other components, HTML elements, or strings.

```
##%{someElement}## - Inserts a DOM element or array of elements
```

Example:

**Single element:**
```html
<!-- data = { childElement: document.createElement('div') }; -->
<div class="container">
  ##%data.childElement##
</div>
```
Output =>
```html
<div class="container">
  <div></div>
</div>
```

**Array of elements:**
```html
<div class="container">
  ##%data.childElements##
</div>
```
Output =>
```html
<!-- data = { childElements: [document.createElement('div'), document.createElement('span')] }; -->
<div class="container">
  <div></div>
  <span></span>
</div>
```

**Array of components:**
```html
<div class="container">
  ##%data.subComponents##
</div>
```
Output =>
```html
<!-- data = { subComponents: [tmpl.do.SimpleLabel({label: 'Count: '}), tmpl.do.SimpleButton({label: 'Button'})] }; -->
<div class="container">
  <span class="do-Simple-Label">Count: </span>
  <button class="do-Simple-Button" style="color: red">Button</button>
</div>
```

**Dynamic Element Insertion:**

```javascript
// Insert an element or array of elements
<div class="container">
  ##%data.dynamicElements##
</div>
```

With optional non-blocking insertion:
```html
<div class="container">
  ##%data.heavyComponent::true##
</div>
```

The second parameter (after `::`) indicates that insertion should be non-blocking (async).


#### `##! ##` Pre-Evaluation

```
##!
  // Code that runs before template processing
  bridge.tmplTool.addI18ns({...});
##
```
Executes necessary initialization logic when the Template is loaded.
This method runs only once—during the Template's initial load—not on each Component instantiation.
It is suitable for one-time setup tasks, such as loading i18n data.


#### `## ##` JavaScript Code Block
Allows you to write JavaScript code directly within templates.

Example:

**JavaScript Code Evaluation**
```html
<template id="my-component">
  ##
    let count = data.count || 0;
    let displayText = 'Count: ' + count;
    function incrementCount() {
      count++;
      tmplScope.refresh({count: count});
    }
  ##
  <div>
    ##=displayText##
    <button data-bridge-event="##:{click: incrementCount##}##">Increment</button>
  </div>
</template>
```

**Conditional Rendering**

```html
<template id="my-component">
  ##if (data.isAdmin) {##
  <div class="admin-panel">Admin Controls</div>
  ##} else {##
  <div class="user-panel">User View</div>
  ##}##
</template>
```
Output =>
```html
<!--tmpl.my.component({isAdmin: true}).element-->
<div class="admin-panel">Admin Controls</div>
or
<!--tmpl.my.component({isAdmin: false}).element-->
<div class="user-panel">User View</div>
```


**Loops**

```html
##data.items.forEach(function(item) {##
  <div class="item">##=item.name##</div>
##})##
```
Output =>
```html
// data.items = ['Item 1', 'Item 2']
<div class="item">Item 1</div>
<div class="item">Item 2</div>
```

More complex example:
```html
<ul>
##data.items.forEach(function(item, index) {##
  <li class="##=index % 2 === 0 ? 'even' : 'odd'##">
    <span>##=item.name##</span>
    <span>##=item.price##</span>
  </li>
##})##
</ul>
```
Output =>
```html
// data.items = [{name: 'Item 1', price: 10}, {name: 'Item 2', price: 20}]
<ul>
  <li class="even">
    <span>Item 1</span>
    <span>10</span>
  </li>
  <li class="odd">
    <span>Item 2</span>
    <span>20</span>
  </li>
</ul>
```


#### `### ##` Lazy Evaluation

```html
<template id="my-component">
<div>Sample Text</div>
### 
  // Code that will run after the template is rendered
  console.log('Template rendered!');
  this.innerText = 'Updated Text';
##
</template>
```
Output =>
```html
<div>Updated Text</div>
```

This is intended for post-rendering operations.
You can refer to the corresponding HTML element using the `this` keyword.


#### `#\# #\#` Comment Areas

```javascript
#\#This is a comment area that won't be rendered#\#
```

This syntax allows you to include comments in your templates that won't appear in the final output.


### HTML Element Expressions

Bridge.js provides several special HTML attributes to handle element references, events, and dynamic content:

- `data-bridge-event="##:{eventType: handler}##"` - Attach event handlers
- `data-bridge-element-ref="var: value"` - Bind variable to element
- `data-bridge-named-element="key: value"` - Set properties on template scope
- `data-bridge-load="handler"` - Run function when element is loaded


#### `data-bridge-event="##:{eventType: handler}##"` - Event Handling

Attaches event handlers to HTML elements. The attribute takes a template expression that can define one or multiple event handlers.

**Basic Usage:**

```html
<button data-bridge-event="##:{
  click: function(element, event, {data, customData, targetElement, tmplScope}) {
    console.log('Button clicked');
  }
}##">Click Me</button>
```

The event handler receives:
1. `element` - The element that triggered the event
2. `event` - The DOM event object
3. `data` - An object containing:
   - `data` - The component's data object
   - `customData` - The optional custom data passed after `::`
   - `targetElement` - The parent element/container
   - `tmplScope` - The template scope object

**Defalut Single Events:**
```html
<input data-bridge-event="##:handleClick##" />
==
<input data-bridge-event="##:{click: handleClick}##" />
```

Defalut event name is `click`

**Multiple Events:**

```html
<input data-bridge-event="##:{
  focus: handleFocus,
  blur: handleBlur,
  input: handleInput
}##" />
```

**With Custom Data:**

```html
<button data-bridge-event="##:handleClick::data.specificItem##">
  Click for item details
</button>
```

- customData: The specific data item (data.specificItem in this example)

**With Multiple Custom Data:**

```javascript
// Multiple event groups separated by :::
<div data-bridge-event="##:handleClick::data.item1:::handleHover::data.item2##">Interact</div>
```

**Auto-Running Events on Load:**

```javascript
<div data-bridge-event="##:{
  load: function(element, ref, data) {
    console.log('Element loaded', element);
    // Initialize the element
  }
}##">Content</div>
```

**Triggerable Events:**

```javascript
<button data-bridge-event="##:{
  triggerKey: 'submitButton',
  click: handleSubmit
}##">Submit</button>
```

You can trigger this event programmatically:
```javascript
tmplScope.trigger.submitButton.click(); // Triggers the click event
```

#### `data-bridge-named-element="key: value"` - Element References

Creates a named reference to an element that is accessible in the template scope:

```html
<input type="text" data-bridge-named-element="##:'nameInput'##">
```

Now you can access the element as `tmplScope.nameInput` from anywhere in the template or component:

```html
<button data-bridge-event="##:{
  click: function(el, event, data) {
    console.log('Input value:', tmplScope.nameInput.value);
  }
}##">Get Value</button>
```

#### `data-bridge-element-ref="var: value"` - Element Variables

Similar to `data-bridge-named-element` but allows defining a local variable that can be used within the template code:

```html
<template id="form-example">
  ##
    let formData = {};
    function submitForm() {
      formData.name = nameInput.value;
      formData.email = emailInput.value;
      console.log('Submitted:', formData);
    }
  ##
  
  <form>
    <input type="text" placeholder="Name" data-bridge-element-ref="##:nameInput##">
    <input type="email" placeholder="Email" data-bridge-element-ref="##:emailInput##">
    
    <button type="button" data-bridge-event="##:{
      click: submitForm
    }##">Submit</button>
  </form>
</template>
```

Notice how `nameInput` and `emailInput` are available as variables in the JavaScript code block.

#### `data-bridge-load="handler"` - Element Loading

Executes a function when an element is loaded into the DOM:

```html
<div data-bridge-load="##:initializeContent::data.settings##"></div>
```

The handler function receives:
1. `element` - The element itself
2. An object containing:
   - `data` - The component's data object
   - `customData` - The optional custom data passed after `::`
   - `targetElement` - The parent element/container
   - `tmplScope` - The template scope object

Example handler:

```javascript
function initializeContent(element, params) {
  const { data, customData, targetElement, tmplScope } = params;
  
  // Initialize the element with custom data
  element.innerHTML = `<h2>${customData.title}</h2>`;
  
  // Maybe add some child elements
  const list = document.createElement('ul');
  data.items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.name;
    list.appendChild(li);
  });
  
  element.appendChild(list);
}
```

## Advanced Features

### Internationalization Support (i18n)

```javascript
// Add translations
bridge.tmplTool.addI18n('greeting', {
  'en': 'Hello',
  'fr': 'Bonjour',
  'es': 'Hola'
});

// Add nested translations
bridge.tmplTool.addI18n('messages.welcome', {
  'en': 'Welcome to our site',
  'fr': 'Bienvenue sur notre site',
  'es': 'Bienvenido a nuestro sitio'
});

// Add multiple translations at once
bridge.tmplTool.addI18ns({
  'greeting': {
    'en': 'Hello',
    'fr': 'Bonjour'
  },
  'farewell': {
    'en': 'Goodbye',
    'fr': 'Au revoir'
  }
});

<span>##=bridge.i18n.greeting('Hello')##</span>
<p>##=bridge.i18n.messages.welcome('Welcome to our site')##</p>
```

The default language is determined by `document.documentElement.lang`.


**Use in template (i18n)**

```javascript
##!
bridge.tmplTool.addI18ns({
  'my-component': {
    'greeting': {
      'en': 'Hello',
      'fr': 'Bonjour'
    }
  }
});
##
<template id="my-component">
  <div>##=i18n.greeting## ##=data.name##!</div>
</template>
```

### Remapping Templates

```javascript
// Remap template IDs
bridge.remapTmpl({
  'old-template-id': 'new-template-id'
});
```

### Custom Template Settings

```javascript
// Define custom template settings
const customSettings = {
  dataKeyName: 'model',  // Use 'model' instead of 'data' in templates
  statusKeyName: 'state', // Use 'state' instead of 'status' in templates
  // Override or extend other settings
};

// Create template with custom settings
bridge.tmplTool.addTmpl('custom-template', templateString, customSettings);
```

**Override Template Expressions**
```javascript
bridge.tmplTool.addTmpl('do-Simple-Sample', '<div>{{=data.label}}</div>', {
  interpolate : {
    pattern: /{{=([\s\S]+?)}}/g,
    exec: function(interpolate) {
      return "'+((__t=(" + interpolate + "))==null?'':__t)+'";
    }
  },
});
```

## Template Lifecycle

Templates in Bridge.js have a lifecycle that you can manage:

### Rendering

```javascript
// Render a template with data
var tmplScope = bridge.tmpl('my-template')(userData);
```

### Appending to DOM

```javascript

// Append by reference
document.body.appendChild(tmplScope.element)

// Append to a container
tmplScope.appendTo(document.getElementById('container'));

// Or directly render into a container
bridge.tmpl('my-template')(userData, document.getElementById('container'));

// With a callback
bridge.tmpl('my-template')(userData, document.getElementById('container'), function(scope) {
  console.log('Template rendered and appended!');
});
```

### Updating Data

```javascript
// Re-render with new data
tmplScope.render({
  name: 'Jane Doe',
  email: 'jane@example.com'
});

// Or update specific properties
tmplScope.refresh({
  name: 'Jane Doe'
});
```

### Removing from DOM

```javascript
// Remove the template from DOM
tmplScope.remove();

// Remove but leave a spacer element
tmplScope.remove(true);
```

### Replacing with Another Template

```javascript
// Replace with another template
tmplScope.replace(anotherTmplScope);
```

### Lifecycle Hooks

```javascript
// Setup lifecycle hooks
tmplScope.beforeAppendTo = function() {
  console.log('Before appending to DOM');
};

tmplScope.afterAppendTo = function() {
  console.log('After appending to DOM');
};

tmplScope.beforeRemove = function() {
  console.log('Before removing from DOM');
};

tmplScope.afterRemove = function() {
  console.log('After removing from DOM');
};

tmplScope.beforeRefresh = function() {
  console.log('Before refreshing data');
};

tmplScope.afterRefresh = function() {
  console.log('After refreshing data');
};
```

## API Reference

### Template Creation

- `bridge.tmplTool.addTmpl(id, content, settings)` - Creates a new template
  - `id` - Template identifier
  - `content` - Template string or DOM element
  - `settings` - Optional template settings

- `bridge.tmplTool.addTmpls(source, removeInnerTemplate, settings)` - Loads multiple templates from source
  - `source` - HTML string or DOM element containing templates
  - `removeInnerTemplate` - Whether to remove templates after loading
  - `settings` - Optional template settings

- `bridge.tmplTool.addTmplByUrl(url, options, callback)` - Loads templates from URL
  - `url` - URL string or object with URL and options
  - `options` - Loading options (loadScript, loadStyle, loadLink)
  - `callback` - Function to call after loading

### Template Rendering

- `bridge.tmpl(id)(data, container, callback, tmplScope)` - Renders a template with data
  - `id` - Template identifier
  - `data` - Data object to render with
  - `container` - Optional element to append to
  - `callback` - Optional function to call after rendering
  - `tmplScope` - Optional existing scope to reuse

### Template Scope Methods

- `tmplScope.appendTo(element)` - Appends template to element
- `tmplScope.render(data)` - Re-renders with new data
- `tmplScope.refresh(data)` - Updates with partial data
- `tmplScope.remove(spacer)` - Removes from DOM
- `tmplScope.replace(newScope)` - Replaces with another template
- `tmplScope.release()` - Releases template resources
- `tmplScope.element` - Reference to the rendered DOM element
- `tmplScope.data` - The data used to render the template
- `tmplScope.status` - Status object for template state
- `tmplScope._id` - Unique ID for the template instance
- `tmplScope.tmplId` - The template ID

### Internationalization

- `bridge.tmplTool.addI18n(key, translations)` - Adds translations for a key
  - `key` - Translation key (can be nested with dots)
  - `translations` - Object mapping language codes to translations

- `bridge.tmplTool.addI18ns(translationsObject)` - Adds multiple translations
  - `translationsObject` - Object mapping keys to translation objects

- `bridge.i18n[key](defaultText)` - Gets translation for current language
  - `key` - Translation key
  - `defaultText` - Default text if translation not found

### Utility Functions

- `bridge.tmplTool.tag(tagName, attributes)` - Creates a DOM element
  - `tagName` - Type of element to create
  - `attributes` - Object of attributes to set

- `bridge.tmplTool.props(...props)` - Creates HTML attribute string
  - `props` - Objects of properties to convert to attributes

- `bridge.tmplTool.genId(prefix)` - Generates a unique ID
  - `prefix` - ID prefix (usually template ID)

- `bridge.tmplTool.escapeHtml.escape(string)` - Escapes HTML characters
  - `string` - String to escape

- `bridge.tmplTool.escapeHtml.unescape(string)` - Unescapes HTML characters
  - `string` - String to unescape

### Configuration Options

- `bridge.tmplTool.showTime` - Enable template rendering time logging
- `bridge.tmplTool.debug` - Enable debug mode
- `bridge.tmplTool.requestCacheControl` - Enable caching for HTTP requests
- `bridge.tmplTool.throwError` - Throw errors instead of silently failing


## Built-in Components

Bridge.js comes with some built-in utility templates:

### br-Tag

Creates a DOM element with attributes:

```javascript
// Create a div with attributes
bridge.tmpl('br-Tag')(['div', { id: 'myDiv', class: 'container' }]);

// Create an input element
bridge.tmpl('br-Tag')(['input', { 
  type: 'text', 
  name: 'username', 
  placeholder: 'Enter username' 
}]);
```

### br-Div

Creates a div with content:

```javascript
bridge.tmpl('br-Div')({
  id: 'myDiv',
  class: 'container',
  style: 'color: red',
  content: 'Hello World',
  event: {
    click: function(element, event, data) { 
      alert('Clicked!'); 
    }
  }
});

// With dynamic content
bridge.tmpl('br-Div')({
  id: 'container',
  content: anotherDomElement // or array of elements
});
```

### br-Input

Creates an input element:

```javascript
bridge.tmpl('br-Input')({
  name: 'username',
  type: 'text',
  value: 'John',
  class: 'form-control',
  event: {
    input: function(element, event) {
      console.log('Value:', element.value);
    }
  }
});
```

### br-Select

Creates a select dropdown:

```javascript
bridge.tmpl('br-Select')({
  name: 'country',
  value: 'us',
  placeholder: 'Select a country',
  options: [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' }
  ],
  event: {
    change: function(element, event, data) {
      console.log('Selected:', element.value);
    }
  }
});
```

### br-Template-Viewer

A utility for viewing and debugging templates:

```javascript
// Create a template viewer with component examples
bridge.tmpl('br-Template-Viewer')({
  label: 'My Components',
  description: 'A collection of UI components',
  components: {
    'button-template': [
      'bridge.tmpl("button-template")({label: "Primary Button", type: "primary"})',
      'bridge.tmpl("button-template")({label: "Secondary Button", type: "secondary"})'
    ],
    'card-template': [
      'bridge.tmpl("card-template")({title: "Card 1", content: "Content 1"})',
      'bridge.tmpl("card-template")({title: "Card 2", content: "Content 2"})'
    ]
  }
});
```

## Internal Workings

### Template Compilation Process

1. Template text is parsed using regex patterns defined in `Bridge.templateSettings`
2. Code blocks are extracted and processed
3. A JavaScript function is generated that produces HTML when executed
4. The function is cached for future use
5. When called with data, the function evaluates the template and returns HTML
6. The HTML is converted to DOM elements
7. Post-processing (lazy evaluation) is applied
8. The template scope object is created and returned

### Lazy Evaluation System

Bridge.js uses a "lazy evaluation" system to handle dynamic elements and events. This process:

1. During template rendering, markers are inserted into the HTML
2. After the DOM is created, these markers are processed
3. Events are attached, elements are inserted, and other dynamic actions are performed
4. This ensures proper timing for DOM manipulation

### Template Scope

The template scope (`tmplScope`) is a powerful object that:

1. Holds references to the rendered element
2. Contains the data used for rendering
3. Provides lifecycle methods
4. Stores references to important elements
5. Manages events and triggers
6. Connects the template to the application

## Best Practices

### Performance Optimization

1. **Minimize Re-renders**: Use `refresh()` for minor updates instead of `render()`
2. **Batch DOM Operations**: Use document fragments when inserting multiple elements
3. **Cache Selectors**: Store element references using `data-bridge-element-ref` or `data-bridge-named-element`
4. **Lazy Loading**: Use non-blocking element insertion for heavy components
5. **Template Granularity**: Create smaller, reusable templates instead of large monolithic ones

### Code Organization

1. **Template Namespacing**: Use consistent ID patterns like `module-component`
2. **Data Preparation**: Format data before passing to templates
3. **Event Delegation**: Use event delegation patterns for dynamic content
4. **Separation of Concerns**: Keep templates focused on presentation
5. **Documentation**: Comment templates with their expected data structure

### Error Handling

1. **Validate Input Data**: Check data before rendering
2. **Fallbacks**: Provide fallback content for missing data
3. **Error Recovery**: Use try/catch for data processing
4. **Debug Mode**: Enable `bridge.tmplTool.debug` during development



## Code Examples

### Simple User Card

```javascript
bridge.tmplTool.addTmpl('user-card', `
  <div class="user-card">
    <img src="##=data.avatar##" alt="##=data.name##">
    <div class="user-info">
      <h3>##=data.name##</h3>
      <p class="title">##=data.title##</p>
      ##if (data.isOnline) {##
        <span class="status online">Online</span>
      ##} else {##
        <span class="status offline">Offline</span>
      ##}##
      <button data-bridge-event="##:{
        click: function(event) {
          alert('Contact ' + data.name);
        }
      }##">Contact</button>
    </div>
  </div>
`);

// Usage
bridge.tmpl('user-card')({
  name: 'John Doe',
  avatar: 'https://example.com/avatar.jpg',
  title: 'Software Engineer',
  isOnline: true
}, document.getElementById('container'));
```

### Data Table with Sorting

```javascript
bridge.tmplTool.addTmpl('data-table', `
  <table class="data-table">
    <thead>
      <tr>
        ##data.columns.forEach(function(column) {##
          <th data-bridge-event="##:{
            click: function(event) {
              status.sortBy = column.key;
              status.sortDir = status.sortDir === 'asc' ? 'desc' : 'asc';
              tmplScope.refresh();
            }
          }##">
            ##=column.label##
            ##if (status.sortBy === column.key) {##
              <span class="sort-icon">##=status.sortDir === 'asc' ? '↑' : '↓'##</span>
            ##}##
          </th>
        ##})##
      </tr>
    </thead>
    <tbody>
      ##
        var items = data.items.slice();
        var sortBy = status.sortBy;
        var sortDir = status.sortDir || 'asc';
        
        if (sortBy) {
          items.sort(function(a, b) {
            var aVal = a[sortBy];
            var bVal = b[sortBy];
            var result = aVal > bVal ? 1 : (aVal < bVal ? -1 : 0);
            return sortDir === 'asc' ? result : -result;
          });
        }
      ##
      ##items.forEach(function(item) {##
        <tr>
          ##data.columns.forEach(function(column) {##
            <td>##=item[column.key]##</td>
          ##})##
        </tr>
      ##})##
    </tbody>
  </table>
`);

// Usage
bridge.tmpl('data-table')({
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'age', label: 'Age' },
    { key: 'email', label: 'Email' }
  ],
  items: [
    { name: 'John', age: 28, email: 'john@example.com' },
    { name: 'Jane', age: 32, email: 'jane@example.com' },
    { name: 'Bob', age: 45, email: 'bob@example.com' }
  ]
}, document.getElementById('table-container'));
```

### Form with Validation

```javascript
bridge.tmplTool.addTmpl('signup-form', `
  <form class="signup-form" data-bridge-element-ref="##:form##" data-bridge-event="##:{
    submit: function(event) {
      event.preventDefault();
      
      // Reset errors
      status.errors = {};
      status.nameInput = nameInput.value;
      status.emailInput = emailInput.value;
      
      // Validate
      if (!nameInput.value) {
        status.errors.name = 'Name is required';
      }
      
      if (!emailInput.value) {
        status.errors.email = 'Email is required';
      } else if (!/.+@.+\..+/.test(emailInput.value)) {
        status.errors.email = 'Invalid email format';
      }
      
      if (Object.keys(status.errors).length === 0) {
        // Submit form data
        console.log('Form submitted:', {
          name: nameInput.value,
          email: emailInput.value
        });
        status.submitted = true;
      }
      
      tmplScope.refresh({});
    }
  }##">
    ##if (status.submitted) {##
      <div class="success-message">
        <h3>Thank you for signing up!</h3>
        <p>We've sent a confirmation to your email.</p>
        <button data-bridge-event="##:{
          click: function(event) {
            status.submitted = false;
            tmplScope.refresh();
          }
        }##">Sign up another</button>
      </div>
    ##} else {##
      <div class="form-group">
        <label for="name">Name</label>
        <input 
          type="text" 
          id="name" 
          data-bridge-element-ref="##:nameInput##"
          value="##=status.nameInput##"
          class="##=status.errors && status.errors.name ? 'error' : ''##"
        >
        ##if (status.errors && status.errors.name) {##
          <div class="error-message">##=status.errors.name##</div>
        ##}##
      </div>
      
      <div class="form-group">
        <label for="email">Email</label>
        <input 
          type="email" 
          id="email" 
          value="##=status.emailInput##"
          data-bridge-element-ref="##:emailInput##"
          class="##=status.errors && status.errors.email ? 'error' : ''##"
        >
        ##if (status.errors && status.errors.email) {##
          <div class="error-message">##=status.errors.email##</div>
        ##}##
      </div>
      
      <button type="submit" data-bridge-event="##:() => form.dispatchEvent(new Event('submit'))##">Sign Up</button>
    ##}##
  </form>
`);

// Usage
bridge.tmpl('signup-form')({}, document.getElementById('form-container'));
```

### Component Composition

```javascript
// Child component
bridge.tmplTool.addTmpl('user-avatar', `
  <div class="avatar-container">
    <img src="##=data.src##" alt="##=data.name##" class="avatar">
    ##if (data.showBadge) {##
      <span class="badge">##=data.badgeText##</span>
    ##}##
  </div>
`);

// Parent component that uses the child component
bridge.tmplTool.addTmpl('user-profile', `
  <div class="profile-card">
    ##%bridge.tmpl('user-avatar')({
      src: data.avatarUrl,
      name: data.name,
      showBadge: data.isPremium,
      badgeText: 'Premium'
    })##
    
    <div class="profile-info">
      <h2>##=data.name##</h2>
      <p>##=data.bio##</p>
      
      <div class="profile-stats">
        <div class="stat">
          <span class="stat-value">##=data.followers##</span>
          <span class="stat-label">Followers</span>
        </div>
        <div class="stat">
          <span class="stat-value">##=data.following##</span>
          <span class="stat-label">Following</span>
        </div>
      </div>
      
      <button data-bridge-event="##:{
        click: function() {
          alert('Following ' + data.name);
        }
      }##">Follow</button>
    </div>
  </div>
`);

// Usage
bridge.tmpl('user-profile')({
  name: 'Jane Smith',
  avatarUrl: 'https://example.com/jane.jpg',
  bio: 'Web developer and designer',
  isPremium: true,
  followers: 1250,
  following: 350
}, document.getElementById('profile-container'));
```

### Dynamic Content Loading

```javascript
bridge.tmplTool.addTmpl('content-loader', `
  <div class="content-loader">
    <h2>##=data.title##</h2>
    <div class="content-container" data-bridge-load="##:function(element, {data}) {
      // Simulate async content loading
      element.innerHTML = '<div class="loading">Loading...</div>';
      
      setTimeout(function() {
        element.innerHTML = '<div class="content">' + data.content + '</div>';
      }, 1000);
    }::data##"></div>
    <button data-bridge-event="##:{
      click: function(event) {
        tmplScope.refresh({
          title: data.title + ' (Refreshed)',
          content: 'New content loaded at ' + new Date().toLocaleTimeString()
        });
      }
    }##">Refresh</button>
  </div>
`);

// Usage
bridge.tmpl('content-loader')({
  title: 'Dynamic Content',
  content: 'Initial content loaded at ' + new Date().toLocaleTimeString()
}, document.getElementById('content-container'));
```

### Interactive Todo List

```javascript
bridge.tmplTool.addTmpl('todo-list', `
  <div class="todo-app">
    <h2>Todo List</h2>
    
    <form class="todo-form">
      <input 
        type="text" 
        placeholder="Add new task..." 
        data-bridge-element-ref="##:newTaskInput##"
      >
      <button type="submit" data-bridge-event="##:{
          click: function(event) {
        event.preventDefault();
        
        if (!newTaskInput.value.trim()) return;
        
        // Add new task
        data.tasks.push({
          id: Date.now(),
          text: newTaskInput.value,
          completed: false
        });
        
        // Clear input
        newTaskInput.value = '';
        
        // Update view
        tmplScope.refresh({});
      }
    }##">Add</button>
    </form>
    
    <ul class="todo-list">
      ##if (data.tasks.length === 0) {##
        <li class="empty-message">No tasks yet. Add one above!</li>
      ##} else {##
        ##data.tasks.forEach(function(task) {##
          <li class="todo-item ##=task.completed ? 'completed' : ''##">
            <input 
              type="checkbox" 
              ##=task.completed ? 'checked' : ''##
              data-bridge-event="##:{
                change: function(event) {
                  // Update task completion status
                  task.completed = el.checked;
                  tmplScope.refresh({});
                }
              }##"
            >
            <span class="todo-text">##=task.text##</span>
            <button class="delete-btn" data-bridge-event="##:{
              click: function(event) {
                // Remove task
                var index = data.tasks.findIndex(function(t) { return t.id === task.id; });
                if (index !== -1) {
                  data.tasks.splice(index, 1);
                  tmplScope.refresh({});
                }
              }
            }##">Delete</button>
          </li>
        ##})##
      ##}##
    </ul>
    
    ##if (data.tasks.length > 0) {##
      <div class="todo-stats">
        <span>##=data.tasks.filter(function(t) { return t.completed; }).length## of ##=data.tasks.length## completed</span>
        <button data-bridge-event="##:{
          click: function(event) {
            // Clear completed tasks
            data.tasks = data.tasks.filter(function(t) { return !t.completed; });
            tmplScope.refresh({});
          }
        }##">Clear completed</button>
      </div>
    ##}##
  </div>
`);

// Usage
bridge.tmpl('todo-list')({
  tasks: [
    { id: 1, text: 'Learn Bridge.js', completed: true },
    { id: 2, text: 'Build a todo app', completed: false },
    { id: 3, text: 'Share with the community', completed: false }
  ]
}, document.getElementById('app-container'));
```



## Documentation

For more detailed information, check out the [documentation](https://wadolsh.github.io/bridge-js/).

## License

MIT