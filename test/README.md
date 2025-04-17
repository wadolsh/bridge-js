# Bridge-js Test Suite

A test suite for validating the functionality of the Bridge-js library.

## Test Structure

- `bridge-test-suite.js` - Test framework core
- `template-tests.js` - Template syntax tests
- `html-element-tests.js` - HTML element tests
- `run-tests.js` - Test execution manager
- `index.html` - Test execution page

## Test Cases

### Template Syntax Tests

1. Basic text template rendering
2. Data binding (`##=data##`) functionality
3. Conditional statements (`##if...##`) support
4. Loop support
5. Element insertion (`##%`) functionality
6. HTML escaping (`##-`) functionality
7. Lazy evaluation (`###`) functionality

### HTML Element Tests

1. Basic HTML element creation and attributes
2. Nested HTML element creation
3. Data-bound attributes
4. Event binding
5. Element references via named-element
6. Template rendering and updating

## Usage

1. Open the `index.html` file in a browser.
2. Click the "Run Tests" button.
3. Check the test results in the console output area.

## Extending the Tests

To add new tests:

1. Add new test cases to the `template-tests.js` or `html-element-tests.js` files.
2. Write tests in the format `BridgeTest.it('test description', function() { ... });`
3. Use assertion methods like `BridgeTest.assertEquals`, `BridgeTest.assertTrue`, etc. to perform validations.
