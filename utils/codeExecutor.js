const axios = require('axios');

/**
 * Online Code Execution using Piston API
 * Piston is a free, open-source online code execution system
 * API: https://github.com/engineer-man/piston
 */

const PISTON_API_URL = 'https://emkc.org/api/v2/piston';

/**
 * Executes code using Piston API
 * @param {string} code - The source code
 * @param {string} input - The input to provide to the program
 * @param {string} language - Programming language (default: 'c')
 * @returns {Promise<{success: boolean, output?: string, error?: string}>}
 */
const executeCode = async (code, input, language = 'c') => {
      try {
            // Map our language names to Piston's language names
            const languageMap = {
                  'c': { language: 'c', version: '10.2.0' },
                  'cpp': { language: 'cpp', version: '10.2.0' },
                  'python': { language: 'python', version: '3.10.0' },
                  'java': { language: 'java', version: '15.0.2' },
                  'javascript': { language: 'javascript', version: '18.15.0' }
            };

            const langConfig = languageMap[language.toLowerCase()] || languageMap['c'];

            // Prepare the request payload
            const payload = {
                  language: langConfig.language,
                  version: langConfig.version,
                  files: [
                        {
                              name: language === 'python' ? 'main.py' :
                                    language === 'java' ? 'Main.java' :
                                          language === 'javascript' ? 'main.js' : 'main.c',
                              content: code
                        }
                  ],
                  stdin: input,
                  compile_timeout: 10000,  // 10 seconds
                  run_timeout: 5000,        // 5 seconds
                  compile_memory_limit: -1,
                  run_memory_limit: -1
            };

            // Execute code via Piston API
            const response = await axios.post(`${PISTON_API_URL}/execute`, payload, {
                  timeout: 20000, // 20 seconds total timeout
                  headers: {
                        'Content-Type': 'application/json'
                  }
            });

            const result = response.data;

            // Check for compilation errors
            if (result.compile && result.compile.code !== 0) {
                  return {
                        success: false,
                        error: `Compilation Error:\n${result.compile.stderr || result.compile.output || 'Unknown compilation error'}`
                  };
            }

            // Check for runtime errors
            if (result.run.code !== 0 && result.run.signal !== null) {
                  return {
                        success: false,
                        error: `Runtime Error:\n${result.run.stderr || result.run.output || 'Program crashed or timed out'}`
                  };
            }

            // Check if there's stderr output (might be warnings or errors)
            if (result.run.stderr && result.run.stderr.trim()) {
                  // Some programs output to stderr but still succeed
                  // Only fail if there's no stdout
                  if (!result.run.stdout || !result.run.stdout.trim()) {
                        return {
                              success: false,
                              error: `Runtime Error:\n${result.run.stderr}`
                        };
                  }
            }

            // Success - return the output
            return {
                  success: true,
                  output: result.run.stdout || ''
            };

      } catch (error) {
            // Handle API errors
            if (error.response) {
                  return {
                        success: false,
                        error: `API Error: ${error.response.data?.message || error.message}`
                  };
            } else if (error.code === 'ECONNABORTED') {
                  return {
                        success: false,
                        error: 'Execution Timeout: Your code took too long to execute'
                  };
            } else {
                  return {
                        success: false,
                        error: `Execution Error: ${error.message}`
                  };
            }
      }
};

/**
 * Validate code against multiple test cases
 * @param {string} code - The source code
 * @param {Array} testCases - Array of test cases with input and expectedOutput
 * @param {string} language - Programming language
 * @returns {Promise<{allPassed: boolean, results: Array}>}
 */
const validateCodeWithTestCases = async (code, testCases, language = 'c') => {
      const results = [];

      for (const testCase of testCases) {
            const executionResult = await executeCode(code, testCase.input, language);

            if (!executionResult.success) {
                  results.push({
                        input: testCase.input,
                        expectedOutput: testCase.expectedOutput,
                        actualOutput: null,
                        passed: false,
                        error: executionResult.error,
                        isHidden: testCase.isHidden
                  });
            } else {
                  const normalizedActual = executionResult.output.trim().replace(/\r\n/g, '\n');
                  const normalizedExpected = testCase.expectedOutput.trim().replace(/\r\n/g, '\n');
                  const passed = normalizedActual === normalizedExpected;

                  results.push({
                        input: testCase.input,
                        expectedOutput: testCase.expectedOutput,
                        actualOutput: executionResult.output,
                        passed,
                        error: null,
                        isHidden: testCase.isHidden
                  });
            }
      }

      const allPassed = results.every(result => result.passed);

      return {
            allPassed,
            results
      };
};

/**
 * Get list of supported languages from Piston
 * @returns {Promise<Array>}
 */
const getSupportedLanguages = async () => {
      try {
            const response = await axios.get(`${PISTON_API_URL}/runtimes`);
            return response.data;
      } catch (error) {
            console.error('Error fetching supported languages:', error.message);
            return [];
      }
};

module.exports = {
      executeCode,
      validateCodeWithTestCases,
      getSupportedLanguages
};
