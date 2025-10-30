# Tests

This directory contains the test suite for ws3-fca.

## Structure

```
tests/
├── unit/              # Unit tests for individual functions
│   ├── sendMessage.test.js
│   └── utils.test.js
├── integration/       # Integration tests
│   └── login.test.js
└── README.md          # This file
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Writing Tests

### Unit Tests

Unit tests should focus on testing individual functions in isolation:

```javascript
const { expect } = require("chai");
const sinon = require("sinon");

describe("MyFunction", function () {
  it("should do something", function () {
    expect(true).to.be.true;
  });
});
```

### Integration Tests

Integration tests should test the interaction between multiple components:

```javascript
describe("Login Integration", function () {
  this.timeout(30000); // Longer timeout for integration tests
  
  it("should login and send message", function (done) {
    // Test implementation
    done();
  });
});
```

## Test Requirements

- All new features should include unit tests
- Critical user flows should have integration tests
- Aim for at least 70% code coverage
- Tests should be independent and not rely on execution order
- Use descriptive test names that explain what is being tested

## Mocking

Use Sinon for mocking:

```javascript
const stub = sinon.stub(obj, 'method');
stub.returns('mocked value');
```

## Test Data

- Never commit real credentials or appState files
- Use mock data for testing
- If integration tests require credentials, use environment variables

## Continuous Integration

Tests are automatically run on:
- Every push to main/develop branches
- Every pull request
- Before publishing to npm (prepublishOnly hook)

