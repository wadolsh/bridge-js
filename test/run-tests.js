// Run all tests
function runAllTests() {
  console.log('===== Bridge-js Tests Started =====');
  
  runTemplateTests();
  runHtmlElementTests();
  
  console.log('\n===== Test Summary =====');
  console.log(`Total Assertions: ${BridgeTest.assertions}`);
  console.log(`Passed: ${BridgeTest.passed}`);
  console.log(`Failed: ${BridgeTest.failed}`);
  
  if (BridgeTest.failed === 0) {
    console.log('\n✓ All tests passed!');
  } else {
    console.log(`\n✗ ${BridgeTest.failed} tests failed.`);
  }
}

// Run tests on page load
document.addEventListener('DOMContentLoaded', runAllTests);

// Export modules (for Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllTests,
    runTemplateTests,
    runHtmlElementTests
  };
}
