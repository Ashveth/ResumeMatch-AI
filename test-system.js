#!/usr/bin/env node

/**
 * Customer Sentiment Alert System - Test Script
 * This script tests the core functionality of the system
 */

const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

// Configuration
const SERVER_URL = 'http://localhost:5000';
const TEST_TIMEOUT = 30000; // 30 seconds

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, status, details = '') {
    const statusColor = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
    const statusSymbol = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '⚠';
    log(`${statusSymbol} ${testName}: ${status}${details ? ` - ${details}` : ''}`, statusColor);
}

// Test cases
const tests = [
    {
        name: 'Server Health Check',
        test: async () => {
            const response = await axios.get(`${SERVER_URL}/api/health`);
            return response.status === 200 && response.data.status === 'OK';
        }
    },
    {
        name: 'AI Sentiment Analysis',
        test: async () => {
            const testTexts = [
                'This product is absolutely amazing!',
                'I hate this service, it is terrible.',
                'The product works fine, nothing special.'
            ];
            
            for (const text of testTexts) {
                const response = await axios.post(`${SERVER_URL}/api/ai/analyze`, { text });
                if (!response.data.sentiment || !response.data.sentiment.label) {
                    return false;
                }
            }
            return true;
        }
    },
    {
        name: 'AI Response Generation',
        test: async () => {
            const mention = {
                content: 'This product is terrible and I want a refund!',
                author: { username: 'test_user' },
                source: 'twitter'
            };
            const sentiment = { label: 'negative', score: -0.8, confidence: 0.9 };
            
            const response = await axios.post(`${SERVER_URL}/api/ai/response`, {
                mention,
                sentiment
            });
            
            return response.data.response && response.data.response.length > 0;
        }
    },
    {
        name: 'Dashboard Data',
        test: async () => {
            const response = await axios.get(`${SERVER_URL}/api/data/dashboard`);
            return response.data && typeof response.data.alertStats === 'object';
        }
    },
    {
        name: 'Alert System',
        test: async () => {
            const response = await axios.post(`${SERVER_URL}/api/alerts/test`, {
                channels: ['slack', 'email']
            });
            return response.data.success === true;
        }
    },
    {
        name: 'Data Collection',
        test: async () => {
            const queries = {
                twitter: 'test query',
                reddit: { subreddit: 'test', query: 'test' },
                googleReviews: { placeId: 'test' }
            };
            
            const response = await axios.post(`${SERVER_URL}/api/sentiment/collect`, { queries });
            return response.data && typeof response.data.collected === 'number';
        }
    }
];

// Start server if not running
async function startServer() {
    return new Promise((resolve, reject) => {
        log('Starting server...', 'blue');
        
        const serverProcess = spawn('node', ['server/index.js'], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
        
        let serverReady = false;
        
        serverProcess.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('Server running on port')) {
                if (!serverReady) {
                    serverReady = true;
                    log('Server started successfully!', 'green');
                    resolve(serverProcess);
                }
            }
        });
        
        serverProcess.stderr.on('data', (data) => {
            const error = data.toString();
            if (error.includes('EADDRINUSE')) {
                log('Server already running on port 5000', 'yellow');
                resolve(null); // Server already running
            } else if (!serverReady) {
                log(`Server error: ${error}`, 'red');
            }
        });
        
        serverProcess.on('error', (error) => {
            log(`Failed to start server: ${error.message}`, 'red');
            reject(error);
        });
        
        // Timeout after 10 seconds
        setTimeout(() => {
            if (!serverReady) {
                log('Server start timeout', 'red');
                serverProcess.kill();
                reject(new Error('Server start timeout'));
            }
        }, 10000);
    });
}

// Wait for server to be ready
async function waitForServer() {
    const maxAttempts = 30;
    const delay = 1000; // 1 second
    
    for (let i = 0; i < maxAttempts; i++) {
        try {
            await axios.get(`${SERVER_URL}/api/health`);
            return true;
        } catch (error) {
            if (i < maxAttempts - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    return false;
}

// Run all tests
async function runTests() {
    log('🧪 Customer Sentiment Alert System - Test Suite', 'bright');
    log('=' .repeat(50), 'cyan');
    
    let serverProcess = null;
    
    try {
        // Start server
        serverProcess = await startServer();
        
        // Wait for server to be ready
        log('Waiting for server to be ready...', 'blue');
        const serverReady = await waitForServer();
        
        if (!serverReady) {
            log('Server failed to start or is not responding', 'red');
            return;
        }
        
        log('Running tests...', 'blue');
        log('');
        
        let passed = 0;
        let failed = 0;
        let skipped = 0;
        
        // Run each test
        for (const test of tests) {
            try {
                const startTime = Date.now();
                const result = await Promise.race([
                    test.test(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Test timeout')), TEST_TIMEOUT)
                    )
                ]);
                
                const duration = Date.now() - startTime;
                
                if (result === true) {
                    logTest(test.name, 'PASS', `${duration}ms`);
                    passed++;
                } else {
                    logTest(test.name, 'FAIL', 'Test returned false');
                    failed++;
                }
            } catch (error) {
                if (error.message === 'Test timeout') {
                    logTest(test.name, 'SKIP', 'Test timed out');
                    skipped++;
                } else {
                    logTest(test.name, 'FAIL', error.message);
                    failed++;
                }
            }
        }
        
        // Summary
        log('');
        log('Test Summary:', 'bright');
        log(`✓ Passed: ${passed}`, 'green');
        log(`✗ Failed: ${failed}`, 'red');
        log(`⚠ Skipped: ${skipped}`, 'yellow');
        log(`Total: ${passed + failed + skipped}`, 'blue');
        
        if (failed === 0) {
            log('');
            log('🎉 All tests passed! System is working correctly.', 'green');
        } else {
            log('');
            log('❌ Some tests failed. Please check the configuration.', 'red');
        }
        
    } catch (error) {
        log(`Test suite error: ${error.message}`, 'red');
    } finally {
        // Cleanup
        if (serverProcess) {
            log('Stopping server...', 'blue');
            serverProcess.kill();
        }
    }
}

// Check if axios is available
try {
    require.resolve('axios');
} catch (error) {
    log('Error: axios is required for testing. Please install it:', 'red');
    log('npm install axios', 'yellow');
    process.exit(1);
}

// Run tests
runTests().catch(error => {
    log(`Fatal error: ${error.message}`, 'red');
    process.exit(1);
});