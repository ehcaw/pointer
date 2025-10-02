# Tests Directory

This directory contains all the tests for the project. The test structure mirrors the source code structure for easy organization.

## Directory Structure

```
__tests__/
├── lib/                                    # Tests for utility functions
│   ├── utils.test.ts                      # Core utility functions (cn, ensureJSONString)
│   ├── tiptap-utils.test.ts               # Tiptap editor utilities
│   └── mock-data.test.ts                  # Mock data validation
└── components/whiteboard/                 # Component-specific tests
    └── whiteboard-utils.test.ts           # Whiteboard utility functions
```

## Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage report
bun test:coverage

# Run specific test file
bun test __tests__/lib/utils.test.ts

# Run tests for a specific directory
bun test __tests__/lib/
```

## Test Coverage

The current test suite covers:

- **Utility Functions**: String manipulation, JSON conversion, class name merging
- **URL/Image Handling**: Convex URL normalization, storage ID extraction, file conversion
- **Data Validation**: Type guards, data transformation, mock data integrity
- **Whiteboard Utils**: Theme handling, data serialization/deserialization

## Adding New Tests

When adding new tests, follow these guidelines:

1. **Mirror the source structure**: Place test files in the same relative path as the source files they test
2. **Use descriptive test names**: Test names should clearly describe what they're testing
3. **Test edge cases**: Include tests for null, undefined, empty values, and error conditions
4. **Keep tests focused**: Each test should verify one specific behavior
5. **Use proper assertions**: Be specific about what you expect

### Example Test Structure

```typescript
import { functionToTest } from '../../src/path/to/module';

describe('functionToTest', () => {
  describe('expected behavior', () => {
    it('should do X when given Y', () => {
      // Test implementation
    });
  });

  describe('edge cases', () => {
    it('should handle null/undefined inputs', () => {
      // Test implementation
    });
  });
});
```

## Testing Utilities

The test setup includes:

- **Jest**: Test runner and assertion library
- **React Testing Library**: For React component testing
- **jsdom**: DOM environment for browser API testing
- **Babel**: For TypeScript/JSX transpilation

## Coverage Reports

Coverage reports are generated in the `coverage/` directory when running `bun test:coverage`. The report shows:

- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

Focus on testing business logic and utility functions rather than UI components, as the latter change more frequently and are harder to maintain.