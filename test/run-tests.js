#!/usr/bin/env node

// Simple test runner that doesn't require external dependencies
const fs = require('fs');
const path = require('path');

// Mock browser globals for the app.js file
global.window = {};
global.document = {
    getElementById: () => ({ 
        style: {}, 
        classList: { 
            contains: () => false, 
            remove: () => {}, 
            add: () => {} 
        },
        addEventListener: () => {}
    }),
    addEventListener: () => {}
};
global.localStorage = {
    getItem: () => null,
    setItem: () => {}
};
global.fetch = () => Promise.resolve({ json: () => Promise.resolve({}) });

// Load the tests
require('./app.test.js');