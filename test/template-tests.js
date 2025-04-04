// 1. Template Syntax Tests
function runTemplateTests() {
  BridgeTest.describe('Template Syntax Tests', function() {
    // Basic text template test
    BridgeTest.it('should render basic text template', function() {
      // Create test template
      bridge.tmplTool.addTmpl('test-basic', 'Hello, World!');
      const tmpl = bridge.tmpl('test-basic');
      const result = tmpl({});
      
      BridgeTest.assertTrue(result.element instanceof Node, 'Rendered result should be a node');
      BridgeTest.assertEquals(result.element.textContent, 'Hello, World!', 'Template content should be correctly rendered');
    });
    
    // Data binding test (##=data##)
    BridgeTest.it('should support data binding', function() {
      bridge.tmplTool.addTmpl('test-binding', 'Hello, ##=data.name##!');
      const tmpl = bridge.tmpl('test-binding');
      const result = tmpl({ name: 'Bridge' });
      
      BridgeTest.assertEquals(result.element.textContent, 'Hello, Bridge!', 'Data should be correctly bound');
    });
    
    // Conditional test (##if...##)
    BridgeTest.it('should support conditionals', function() {
      bridge.tmplTool.addTmpl('test-conditional', '##if(data.show){##Visible##}else{##Hidden##}##');
      const tmpl = bridge.tmpl('test-conditional');
      
      const visibleResult = tmpl({ show: true });
      BridgeTest.assertEquals(visibleResult.element.textContent, 'Visible', 'Should show correct content when condition is true');
      
      const hiddenResult = tmpl({ show: false });
      BridgeTest.assertEquals(hiddenResult.element.textContent, 'Hidden', 'Should show correct content when condition is false');
    });
    
    // Loop test
    BridgeTest.it('should support loops', function() {
      bridge.tmplTool.addTmpl('test-loop', '##for(let i=0; i<data.items.length; i++){##Item: ##=data.items[i]####if(i < data.items.length-1){##, ##}####}##');
      const tmpl = bridge.tmpl('test-loop');
      const result = tmpl({ items: ['A', 'B', 'C'] });
      
      BridgeTest.assertEquals(result.element.textContent, 'Item: A, Item: B, Item: C', 'Loop should work correctly');
    });
    
    // Element insertion test (##%)
    BridgeTest.it('should support element insertion', function() {
      const element = document.createElement('span');
      element.textContent = 'Injected Element';
      
      // Fixing the template by wrapping in a div
      bridge.tmplTool.addTmpl('test-element-insertion', '<div>Before ##%data.element## After</div>');
      const tmpl = bridge.tmpl('test-element-insertion');
      const result = tmpl({ element: element });
      
      BridgeTest.assertTrue(result.element.contains(element), 'Inserted element should be included in the result');
      BridgeTest.assertContains(result.element.textContent, 'Before Injected Element After', 'Content of the inserted element should be included');
    });
    
    // Escape test (##-)
    BridgeTest.it('should support HTML escaping', function() {
      bridge.tmplTool.addTmpl('test-escape', '##-data.html##');
      const tmpl = bridge.tmpl('test-escape');
      const result = tmpl({ html: '<div>Test</div>' });
      
      BridgeTest.assertEquals(result.element.textContent, '<div>Test</div>', 'HTML should be escaped');
      BridgeTest.assertTrue(!result.element.querySelector('div'), 'HTML should not be rendered');
    });
    
    // Evaluation test (###)
    BridgeTest.it('should support lazy evaluation', function() {
      bridge.tmplTool.addTmpl('test-lazy-eval', '<div>###data.counter++##</div>');
      const data = { counter: 0 };
      const tmpl = bridge.tmpl('test-lazy-eval');
      const result = tmpl(data);
      
      BridgeTest.assertEquals(data.counter, 1, 'Lazy evaluation should be executed');
    });
  });
}
