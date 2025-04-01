# Bridge-js Component Engine

Bridge-js is a lightweight JavaScript framework for building web applications with reusable components. It provides an intuitive template system that allows you to create, combine, and reuse UI components efficiently.

## Features

- **SPA Support**: Easy creation of Single Page Applications
- **Component-Based**: Build reusable UI components
- **All-in-One Templates**: Define HTML, CSS, and JavaScript logic in a single template
- **Event Handling**: Easily attach events to HTML elements
- **Component Composition**: Combine components like building blocks to create complex UIs

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

**Method 1**: Using bridge.tmplTool.addTmpl()

```javascript
bridge.tmplTool.addTmpl('ui-Button', '<button>##=data.label##</button>');
```

**Method 2**: Using template tags with bridge.tmplTool.addTmpls()

```javascript
bridge.tmplTool.addTmpls(`
  <template id="ui-Button">
    <style id="style-ui-Button">
      .ui-Button {
        padding: 8px 16px;
        background-color: #0078d7;
        color: white;
        border: none;
        border-radius: 4px;
      }
    </style>
    <button class="ui-Button" data-bridge-event="click: data.onClick">
      ##=data.label##
    </button>
  </template>
`);
```

### 2. Create a Component

Once you've defined your templates, you can create components from them:

```javascript
var button = tmpl.ui.Button({
  label: 'Click Me',
  onClick: function() {
    alert('Button clicked!');
  }
});

// Add the component to the DOM
document.body.appendChild(button.element);
```

### 3. Compose Components

Easily combine components to build complex UIs:

```javascript
bridge.tmplTool.addTmpls(`
  <template id="ui-Card">
    <style id="style-ui-Card">
      .ui-Card {
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 16px;
      }
      .ui-Card-title {
        font-size: 18px;
        margin-bottom: 8px;
      }
      .ui-Card-content {
        margin-bottom: 16px;
      }
    </style>
    <div class="ui-Card">
      <div class="ui-Card-title">##=data.title##</div>
      <div class="ui-Card-content">##=data.content##</div>
      <div>##%data.actions##</div>
    </div>
  </template>
`);

// Create a card with a button
var card = tmpl.ui.Card({
  title: 'My Card',
  content: 'This is a card component',
  actions: tmpl.ui.Button({
    label: 'Learn More',
    onClick: function() {
      alert('Learning more about Bridge-js!');
    }
  })
});

document.body.appendChild(card.element);
```

## Template Syntax

Bridge-js uses a special syntax for template expressions:

### Basic Expressions

- `##= ##` - Output string content (HTML will be treated as HTML)
- `##- ##` - Output escaped HTML content (HTML tags will be shown as text)
- `##% ##` - Output component or HTML element
- `## ##` - JavaScript code block
- `### ##` - Style content
- `##! ##` - Comment

### HTML Element Expressions

- `data-bridge-event="eventType: handler"` - Attach event handlers
- `data-bridge-load="handler"` - Run function when element is loaded
- `data-bridge-scope-key="key: value"` - Set properties on template scope
- `data-bridge-var="var: value"` - Bind variable to element

### Example with State Management

```javascript
bridge.tmplTool.addTmpl('app-Counter', `
  <div>
    ##
      var count = data.initialCount || 0;
      
      tmplScope.increment = function() {
        count++;
        tmplScope.refresh();  // Update the component
      };
    ##
    <div>Count: ##=count##</div>
    <button data-bridge-event="click: tmplScope.increment">+</button>
  </div>
`);

var counter = tmpl.app.Counter({initialCount: 5});
document.body.appendChild(counter.element);
```

## Advanced Features

### Load Templates from External Files

```javascript
bridge.tmplTool.addTmplByUrl([
  'templates/components.html',
  'templates/layout.html'
], function() {
  // Templates are now loaded and ready to use
  var app = tmpl.app.Main({});
  document.body.appendChild(app.element);
});
```

### Internationalization Support

```javascript
bridge.tmplTool.addI18n('greeting', {
  'en': 'Hello',
  'es': 'Hola',
  'fr': 'Bonjour'
});

bridge.tmplTool.addTmpl('app-Greeting', `
  <div>##=i18n.greeting## ##=data.name##!</div>
`);
```

## Example Applications

You can find example applications in the examples directory:

- [Simple Counter](examples/counter.html)
- [Todo List](examples/todo.html)
- [Calculator](examples/calculator.html)

## Documentation

For more detailed information, check out the [documentation](https://wadolsh.github.io/bridge-js/).

## License

MIT