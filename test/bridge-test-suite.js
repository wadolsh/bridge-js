// Bridge-js Test Suite
// Test cases for template syntax and HTML elements

// Test framework setup
const BridgeTest = {
  assertions: 0,
  passed: 0,
  failed: 0,
  
  // Create test group
  describe: function(name, testFn) {
    console.log(`\n----- ${name} -----`);
    testFn();
    console.log(`Result: ${this.passed}/${this.assertions} passed`);
  },
  
  // Run individual test
  it: function(description, testFn) {
    console.log(`\nTest: ${description}`);
    try {
      testFn();
      console.log('✓ Success');
    } catch (error) {
      console.error('✗ Failure:', error.message, error);
      this.failed++;
    }
  },
  
  // Assertion functions
  assertEquals: function(actual, expected, message) {
    this.assertions++;
    if (actual !== expected) {
      this.failed++;
      throw new Error(`${message || ''} Expected: ${expected}, Actual: ${actual}`);
    } else {
      this.passed++;
    }
  },
  
  assertContains: function(string, substring, message) {
    this.assertions++;
    if (!string.includes(substring)) {
      this.failed++;
      throw new Error(`${message || ''} Could not find '${substring}' in '${string}'.`);
    } else {
      this.passed++;
    }
  },
  
  assertTrue: function(condition, message) {
    this.assertions++;
    if (!condition) {
      this.failed++;
      throw new Error(message || 'Condition is not true.');
    } else {
      this.passed++;
    }
  },
  
  assertElement: function(element, expectedTag, message) {
    this.assertions++;
    if (!(element instanceof Element)) {
      this.failed++;
      throw new Error(`${message || ''} Element is not an Element instance.`);
    }
    
    if (element.tagName.toLowerCase() !== expectedTag.toLowerCase()) {
      this.failed++;
      throw new Error(`${message || ''} Expected tag: ${expectedTag}, Actual tag: ${element.tagName.toLowerCase()}`);
    } else {
      this.passed++;
    }
  },
  
  assertHasAttribute: function(element, attributeName, expectedValue, message) {
    this.assertions++;
    if (!element.hasAttribute(attributeName)) {
      this.failed++;
      throw new Error(`${message || ''} Element does not have '${attributeName}' attribute.`);
    }
    
    if (expectedValue !== undefined && element.getAttribute(attributeName) !== expectedValue) {
      this.failed++;
      throw new Error(`${message || ''} Expected value for '${attributeName}' attribute: ${expectedValue}, Actual value: ${element.getAttribute(attributeName)}`);
    } else {
      this.passed++;
    }
  }
};
