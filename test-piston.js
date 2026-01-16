// Quick test script to verify Piston API integration
const { executeCode, validateCodeWithTestCases } = require('./utils/codeExecutor');

async function testPistonAPI() {
      console.log('🧪 Testing Piston API Integration...\n');

      // Test 1: Simple Hello World
      console.log('Test 1: Hello World');
      const helloCode = `
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}
`;

      const result1 = await executeCode(helloCode, '', 'c');
      console.log('Result:', result1);
      console.log('✅ Test 1:', result1.success ? 'PASSED' : 'FAILED');
      console.log('');

      // Test 2: Two Sum Problem
      console.log('Test 2: Two Sum');
      const twoSumCode = `
#include <stdio.h>

int main() {
    int n, target;
    scanf("%d", &n);
    
    int nums[n];
    for (int i = 0; i < n; i++) {
        scanf("%d", &nums[i]);
    }
    
    scanf("%d", &target);
    
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            if (nums[i] + nums[j] == target) {
                printf("%d %d\\n", i, j);
                return 0;
            }
        }
    }
    
    return 0;
}
`;

      const testInput = `4
2 7 11 15
9`;

      const result2 = await executeCode(twoSumCode, testInput, 'c');
      console.log('Result:', result2);
      console.log('Expected: "0 1"');
      console.log('Got:', result2.output?.trim());
      console.log('✅ Test 2:', result2.success && result2.output?.trim() === '0 1' ? 'PASSED' : 'FAILED');
      console.log('');

      // Test 3: Compilation Error
      console.log('Test 3: Compilation Error Handling');
      const badCode = `
#include <stdio.h>

int main() {
    printf("Missing semicolon")
    return 0;
}
`;

      const result3 = await executeCode(badCode, '', 'c');
      console.log('Result:', result3);
      console.log('✅ Test 3:', !result3.success && result3.error?.includes('Compilation') ? 'PASSED' : 'FAILED');
      console.log('');

      // Test 4: Multiple Test Cases
      console.log('Test 4: Multiple Test Cases Validation');
      const testCases = [
            {
                  input: '4\n2 7 11 15\n9',
                  expectedOutput: '0 1',
                  isHidden: false
            },
            {
                  input: '3\n3 2 4\n6',
                  expectedOutput: '1 2',
                  isHidden: false
            }
      ];

      const result4 = await validateCodeWithTestCases(twoSumCode, testCases, 'c');
      console.log('Result:', result4);
      console.log('✅ Test 4:', result4.allPassed ? 'PASSED' : 'FAILED');
      console.log('');

      console.log('🎉 All tests completed!');
}

// Run tests
testPistonAPI().catch(console.error);
