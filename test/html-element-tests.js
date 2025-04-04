// 2. HTML Element Tests
function runHtmlElementTests() {
  BridgeTest.describe('HTML Element Tests', function() {
    // Basic element creation test
    BridgeTest.it('should create HTML elements', function() {
      bridge.tmplTool.addTmpl('test-html-element', '<div id="test-div" class="test-class">Test Content</div>');
      const tmpl = bridge.tmpl('test-html-element');
      const result = tmpl({});
      
      BridgeTest.assertElement(result.element, 'div', 'Correct tag should be created');
      BridgeTest.assertHasAttribute(result.element, 'id', 'test-div', 'Correct id should be set');
      BridgeTest.assertHasAttribute(result.element, 'class', 'test-class', 'Correct class should be set');
      BridgeTest.assertEquals(result.element.textContent, 'Test Content', 'Correct content should be set');
    });
    
    // Nested elements test
    BridgeTest.it('should create nested HTML elements', function() {
      bridge.tmplTool.addTmpl('test-nested-element', '<div><span>Child 1</span><p>Child 2</p></div>');
      const tmpl = bridge.tmpl('test-nested-element');
      const result = tmpl({});
      
      BridgeTest.assertElement(result.element, 'div', 'Correct parent tag should be created');
      BridgeTest.assertEquals(result.element.children.length, 2, 'Correct number of child elements should be present');
      BridgeTest.assertElement(result.element.children[0], 'span', 'First child element should be correctly created');
      BridgeTest.assertElement(result.element.children[1], 'p', 'Second child element should be correctly created');
    });
    
    // Data-bound attributes test
    BridgeTest.it('should support data-bound attributes', function() {
      bridge.tmplTool.addTmpl('test-attr-binding', '<div id="##=data.id##" class="##=data.className##">##=data.content##</div>');
      const tmpl = bridge.tmpl('test-attr-binding');
      const result = tmpl({ id: 'dynamic-id', className: 'dynamic-class', content: 'Dynamic Content' });
      
      BridgeTest.assertElement(result.element, 'div', 'Correct tag should be created');
      BridgeTest.assertHasAttribute(result.element, 'id', 'dynamic-id', 'Data-bound id should be set');
      BridgeTest.assertHasAttribute(result.element, 'class', 'dynamic-class', 'Data-bound class should be set');
      BridgeTest.assertEquals(result.element.textContent, 'Dynamic Content', 'Data-bound content should be set');
    });
    
    // Event binding test
    BridgeTest.it('should support event binding', function() {
      let clicked = false;
      
      bridge.tmplTool.addTmpl('test-event-binding', '<button data-bridge-event="##:{click: function() { data.clicked = true; }}##">Click me</button>');
      const tmpl = bridge.tmpl('test-event-binding');
      const result = tmpl({ clicked: false });
      
      BridgeTest.assertElement(result.element, 'button', 'Correct button element should be created');
      
      // Trigger event
      result.element.click();
      
      BridgeTest.assertTrue(result.data.clicked, 'Event handler should be called');
    });
    
    // Scope-key test
    BridgeTest.it('should support element references via scope-key', function() {
      bridge.tmplTool.addTmpl('test-scope-key', '<div data-bridge-scope-key="##:\'targetElement\'##">Target</div>');
      const tmpl = bridge.tmpl('test-scope-key');
      const result = tmpl({});
      
      BridgeTest.assertTrue(result.targetElement instanceof Element, 'Should be able to access element through scope');
      BridgeTest.assertElement(result.targetElement, 'div', 'Referenced element should have correct tag');
      BridgeTest.assertEquals(result.targetElement.textContent, 'Target', 'Referenced element content should be correctly set');
    });
    
    // Template rendering and update test
    BridgeTest.it('should be able to update templates', function() {
      bridge.tmplTool.addTmpl('test-update', '<div>##=data.counter##</div>');
      const tmpl = bridge.tmpl('test-update');
      const result = tmpl({ counter: 1 });
      
      BridgeTest.assertEquals(result.element.textContent, '1', 'Initial rendering should be correct');
      
      // Update template data
      result.render({ counter: 2 });
      
      BridgeTest.assertEquals(result.element.textContent, '2', 'Template data should be updated');
    });
  });
}
