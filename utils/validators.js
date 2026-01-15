const validateOutput = (userOutput, expectedOutput) => {
  const normalizedUserOutput = userOutput.trim().replace(/\r\n/g, '\n');
  const normalizedExpectedOutput = expectedOutput.trim().replace(/\r\n/g, '\n');
  
  return normalizedUserOutput === normalizedExpectedOutput;
};

const validateMultipleTestCases = (userOutput, testCases) => {
  const results = testCases.map(testCase => {
    return {
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      passed: validateOutput(userOutput, testCase.expectedOutput),
      isHidden: testCase.isHidden
    };
  });
  
  const allPassed = results.every(result => result.passed);
  
  return {
    allPassed,
    results
  };
};

module.exports = {
  validateOutput,
  validateMultipleTestCases
};
