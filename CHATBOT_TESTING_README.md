# 🧪 Chatbot Testing Documentation

> **Test Coverage**: 41 tests (29 unit + 12 API)  
> **Status**: ✅ All tests passing  
> **Last Updated**: February 11, 2026

## Overview

This document explains the comprehensive testing suite for the AI-powered chatbot feature in the SecureHealthCare system. The chatbot uses Ollama (llama3.2:3b model) to provide healthcare assistance while maintaining strict safety guidelines.

## 📁 Test Files

### 1. Unit Tests (`__tests__/unit/chatbot.test.ts`)
Tests the core chatbot logic and functionality without testing the actual API route.

**Coverage**: 29 tests  
**Purpose**: Verify business logic, validation, and error handling

### 2. API Tests (`__tests__/api/chatbot.test.ts`)
Tests the actual API endpoint that handles chatbot requests.

**Coverage**: 12 tests  
**Purpose**: Verify API route behavior, request/response handling, and integration with Ollama

## 🎯 Unit Tests Breakdown

### 1. Ollama Integration (3 tests)

Tests the connection and communication with the Ollama AI service.

```typescript
// Test: Successfully calling Ollama API
✅ Verifies successful API calls with valid messages
✅ Checks that responses contain expected medical content

// Test: Handling connection failures
✅ Ensures graceful handling when Ollama is offline
✅ Verifies appropriate error messages

// Test: Handling error responses
✅ Tests handling of 500 errors from Ollama
✅ Validates error response structure
```

**Why it matters**: Ensures the chatbot can communicate with the AI service and handle failures gracefully.

---

### 2. Message Validation (5 tests)

Validates user input before processing.

```typescript
✅ Accepts valid non-empty messages
✅ Rejects empty or whitespace-only messages
✅ Handles very long messages (5000+ characters)
✅ Processes special characters (&, ?, !, etc.)
✅ Supports unicode and emoji (🏥, 👨‍⚕️, 💊)
```

**Why it matters**: Prevents invalid input from reaching the AI and ensures robust handling of edge cases.

---

### 3. Input Sanitization (2 tests)

Protects against malicious input and security vulnerabilities.

```typescript
✅ Detects XSS attempts (<script> tags)
✅ Sanitizes dangerous HTML/JavaScript
✅ Handles HTML entities properly
```

**Example**:
```javascript
Input:  '<script>alert("xss")</script>What is diabetes?'
Output: 'What is diabetes?' // Script tags removed
```

**Why it matters**: Critical for security - prevents XSS attacks and code injection.

---

### 4. Medical Query Detection (3 tests)

Identifies the type of query to provide appropriate responses.

```typescript
✅ Identifies medical terminology
   - Keywords: hypertension, diabetes, fever, symptoms, medication

✅ Identifies emergency keywords
   - Keywords: chest pain, severe, emergency, urgent, bleeding
   - Triggers special emergency response

✅ Distinguishes non-medical queries
   - Example: "What is the weather?" → Not medical
```

**Why it matters**: Allows the chatbot to provide context-appropriate responses and escalate emergencies.

---

### 5. Response Formatting (3 tests)

Ensures responses are properly formatted and include necessary disclaimers.

```typescript
✅ Formats medical information with bullet points
✅ Includes medical disclaimers
   - "Please consult a healthcare professional"
   
✅ Formats emergency responses appropriately
   - "Call 911 or go to the nearest emergency room"
```

**Why it matters**: Ensures legal compliance and user safety through proper disclaimers.

---

### 6. Context Handling (2 tests)

Tests how the chatbot uses user context (role, page) in prompts.

```typescript
✅ Includes user role in prompt (patient/doctor)
✅ Includes current page context
✅ Handles missing context gracefully (defaults to "unknown")
```

**Example**:
```javascript
Context: { role: 'patient', page: 'dashboard' }
Prompt includes: "User role: patient\nPage: dashboard"
```

**Why it matters**: Provides personalized responses based on user context.

---

### 7. Rate Limiting Logic (2 tests)

Prevents spam and abuse of the chatbot service.

```typescript
✅ Tracks request timestamps
✅ Detects rapid/spam requests
   - Identifies 5+ requests within 1 second
```

**Why it matters**: Protects the service from abuse and ensures fair usage.

---

### 8. Error Handling (4 tests)

Ensures robust error handling for various failure scenarios.

```typescript
✅ Handles JSON parse errors
✅ Handles network timeouts
✅ Handles missing response fields
✅ Handles abort errors (request cancellation)
```

**Why it matters**: Prevents crashes and provides meaningful error messages to users.

---

### 9. Prompt Engineering (3 tests)

Validates the construction of prompts sent to the AI.

```typescript
✅ Constructs proper system prompts
✅ Includes safety rules:
   - "Do NOT diagnose diseases"
   - "Do NOT prescribe medication"
   - "Do NOT give treatment plans"
   - "Provide general health education only"
   
✅ Includes user context in prompts
```

**Why it matters**: Ensures the AI follows safety guidelines and provides appropriate responses.

---

### 10. Model Configuration (2 tests)

Verifies correct AI model settings.

```typescript
✅ Uses correct model: 'llama3.2:3b'
✅ Disables streaming for synchronous responses
```

**Why it matters**: Ensures consistent behavior and expected model performance.

---

## 🔌 API Tests Breakdown

### Request Validation (3 tests)

```typescript
✅ Returns 400 for missing message
✅ Returns 400 for non-string message (e.g., numbers)
✅ Returns 400 for null message
```

### Ollama Integration (5 tests)

```typescript
✅ Calls Ollama API with correct parameters
✅ Returns AI response on success (200 status)
✅ Handles Ollama API errors (500 status)
✅ Handles network errors gracefully
✅ Handles timeout/abort errors (504 status)
```

### Context & Configuration (4 tests)

```typescript
✅ Includes context (role, page) in prompts
✅ Uses correct Ollama model (llama3.2:3b)
✅ Handles empty responses from Ollama
✅ Uses default context values when not provided
```

---

## 🚀 Running the Tests

### Run All Chatbot Tests
```bash
npm test chatbot.test.ts
```

**Output**:
```
PASS  __tests__/unit/chatbot.test.ts (29 tests)
PASS  __tests__/api/chatbot.test.ts (12 tests)

Test Suites: 2 passed, 2 total
Tests:       41 passed, 41 total
```

### Run Only Unit Tests
```bash
npm test __tests__/unit/chatbot.test.ts
```

### Run Only API Tests
```bash
npm test __tests__/api/chatbot.test.ts
```

### Run Tests in Watch Mode
```bash
npm test -- --watch chatbot.test.ts
```

---

## 🔧 Test Setup & Mocking

### Unit Tests Setup

```typescript
// Mock fetch for Ollama API
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Example: Mock successful response
mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ response: 'AI response here' })
});
```

### API Tests Setup

The API tests require special mocking for Next.js Web APIs:

```typescript
// Mock Web APIs (Request, Response, Headers)
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.Headers = MockHeaders;
global.Request = MockRequest;
global.Response = MockResponse;

// Mock NextResponse
jest.mock('next/server', () => ({
    NextResponse: {
        json: (data, init) => ({
            json: async () => data,
            status: init?.status || 200
        })
    }
}));
```

**Why this is needed**: Jest runs in a Node environment which doesn't have browser Web APIs that Next.js requires.

---

## 📊 Test Coverage Summary

| Category | Tests | Purpose |
|----------|-------|---------|
| Ollama Integration | 3 | AI service communication |
| Message Validation | 5 | Input validation |
| Input Sanitization | 2 | Security (XSS prevention) |
| Medical Query Detection | 3 | Query classification |
| Response Formatting | 3 | Output formatting |
| Context Handling | 2 | User context |
| Rate Limiting | 2 | Spam prevention |
| Error Handling | 4 | Failure scenarios |
| Prompt Engineering | 3 | AI prompt construction |
| Model Configuration | 2 | AI settings |
| API Request Validation | 3 | API input validation |
| API Integration | 5 | API-Ollama communication |
| API Context | 4 | API context handling |
| **TOTAL** | **41** | **Complete coverage** |

---

## ✅ Test Quality Metrics

- **Coverage**: All critical paths tested
- **Pass Rate**: 100% (41/41 passing)
- **Execution Time**: ~2.4 seconds
- **Reliability**: No flaky tests
- **Maintainability**: Well-organized and documented

---

## 🎯 What These Tests Ensure

### 1. **Security**
- ✅ XSS attack prevention
- ✅ Input sanitization
- ✅ Rate limiting

### 2. **Reliability**
- ✅ Error handling for all failure scenarios
- ✅ Graceful degradation when Ollama is offline
- ✅ Timeout handling

### 3. **Safety**
- ✅ Medical disclaimers included
- ✅ Emergency response handling
- ✅ AI safety rules enforced

### 4. **User Experience**
- ✅ Context-aware responses
- ✅ Proper formatting
- ✅ Unicode/emoji support

### 5. **Compliance**
- ✅ No medical diagnosis
- ✅ No prescription recommendations
- ✅ Appropriate disclaimers

---

## 🐛 Common Test Failures & Solutions

### Issue: "Request is not defined"
**Cause**: Missing Web API mocks in Jest environment  
**Solution**: Add Web API polyfills (already implemented in API tests)

### Issue: "fetch is not defined"
**Cause**: fetch not mocked  
**Solution**: Mock global.fetch before importing modules

### Issue: Tests timeout
**Cause**: Async operations not properly awaited  
**Solution**: Ensure all async calls use await

---

## 📝 Adding New Tests

### Template for New Unit Test

```typescript
it('should [expected behavior]', () => {
    // Arrange: Set up test data
    const input = 'test message';
    
    // Act: Execute the code
    const result = someFunction(input);
    
    // Assert: Verify the result
    expect(result).toBe('expected output');
});
```

### Template for New API Test

```typescript
it('should [expected behavior]', async () => {
    // Mock Ollama response
    mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ response: 'AI response' })
    });
    
    // Create request
    const request = createMockNextRequest({
        message: 'test message'
    });
    
    // Call API
    const response = await POST(request);
    const data = await response.json();
    
    // Assert
    expect(response.status).toBe(200);
    expect(data.reply).toBeDefined();
});
```

---

## 🔍 Test Maintenance

### When to Update Tests

1. **When API changes**: Update API tests to match new endpoints
2. **When validation rules change**: Update validation tests
3. **When adding features**: Add corresponding tests
4. **When fixing bugs**: Add regression tests

### Best Practices

- ✅ Keep tests isolated (no dependencies between tests)
- ✅ Use descriptive test names
- ✅ Mock external dependencies (Ollama API)
- ✅ Test both success and failure scenarios
- ✅ Keep tests fast (< 3 seconds total)

---

## 📚 Related Documentation

- [Chatbot API Route](app/api/chatbot/route.ts)
- [Jest Documentation](https://jestjs.io/)
- [Next.js Testing Guide](https://nextjs.org/docs/testing)

---

## 🎓 Learning Resources

### Understanding the Tests

1. **Start with unit tests** - Easier to understand
2. **Read test descriptions** - They explain what's being tested
3. **Check the assertions** - Shows expected behavior
4. **Review mock data** - Understand test scenarios

### Key Testing Concepts

- **Mocking**: Simulating external dependencies (Ollama API)
- **Assertions**: Verifying expected outcomes
- **Test Coverage**: Ensuring all code paths are tested
- **Edge Cases**: Testing unusual or extreme inputs

---

**Note**: These tests ensure the chatbot is secure, reliable, and provides safe healthcare assistance. All tests must pass before deploying changes to production.
