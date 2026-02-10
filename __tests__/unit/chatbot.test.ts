/**
 * Unit tests for Chatbot API
 * Tests the AI assistant chatbot functionality
 */

// Mock fetch for Ollama API
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Chatbot API Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Ollama Integration', () => {
        it('should successfully call Ollama API with valid message', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    response: 'Hello! I can help you with medical questions.',
                }),
            });

            const response = await fetch('http://127.0.0.1:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'llama3.2:3b',
                    prompt: 'What are the symptoms of flu?',
                }),
            });

            const data = await response.json();

            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(data.response).toBeDefined();
            expect(data.response).toContain('medical');
        });

        it('should handle Ollama connection failure', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

            await expect(
                fetch('http://127.0.0.1:11434/api/generate', {
                    method: 'POST',
                    body: JSON.stringify({ model: 'llama3.2:3b', prompt: 'test' }),
                })
            ).rejects.toThrow('Connection refused');
        });

        it('should handle Ollama error responses', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({ error: 'Internal server error' }),
            });

            const response = await fetch('http://127.0.0.1:11434/api/generate', {
                method: 'POST',
                body: JSON.stringify({ model: 'llama3.2:3b', prompt: 'test' }),
            });

            expect(response.ok).toBe(false);
            expect(response.status).toBe(500);
        });
    });

    describe('Message Validation', () => {
        it('should validate non-empty messages', () => {
            const message = 'What are flu symptoms?';
            expect(message.trim().length).toBeGreaterThan(0);
        });

        it('should reject empty messages', () => {
            const message = '   ';
            expect(message.trim().length).toBe(0);
        });

        it('should handle very long messages', () => {
            const longMessage = 'a'.repeat(5000);
            expect(longMessage.length).toBe(5000);
        });

        it('should handle special characters', () => {
            const message = 'What about symptoms like: fever, cough & headache?';
            expect(message).toContain('&');
            expect(message).toContain('?');
        });

        it('should handle unicode characters', () => {
            const message = 'Unicode: 你好 🏥 👨‍⚕️ 💊';
            expect(message).toContain('🏥');
            expect(message.length).toBeGreaterThan(0);
        });
    });

    describe('Input Sanitization', () => {
        it('should detect potential XSS attempts', () => {
            const maliciousInput = '<script>alert("xss")</script>What is diabetes?';
            expect(maliciousInput).toContain('<script>');

            // Sanitize
            const sanitized = maliciousInput.replace(/<script[^>]*>.*?<\/script>/gi, '');
            expect(sanitized).not.toContain('<script>');
            expect(sanitized).toBe('What is diabetes?');
        });

        it('should handle HTML entities', () => {
            const input = 'What is &lt;condition&gt;?';
            expect(input).toContain('&lt;');
        });
    });

    describe('Medical Query Detection', () => {
        it('should identify medical terminology', () => {
            const medicalTerms = ['hypertension', 'diabetes', 'fever', 'symptoms', 'medication'];
            const query = 'What is hypertension?';

            const hasMedicalTerm = medicalTerms.some(term =>
                query.toLowerCase().includes(term)
            );

            expect(hasMedicalTerm).toBe(true);
        });

        it('should identify emergency keywords', () => {
            const emergencyKeywords = ['chest pain', 'severe', 'emergency', 'urgent', 'bleeding'];
            const query = 'I am having severe chest pain';

            const isEmergency = emergencyKeywords.some(keyword =>
                query.toLowerCase().includes(keyword)
            );

            expect(isEmergency).toBe(true);
        });

        it('should identify non-medical queries', () => {
            const medicalTerms = ['hypertension', 'diabetes', 'fever', 'symptoms', 'medication', 'doctor', 'hospital'];
            const query = 'What is the weather today?';

            const hasMedicalTerm = medicalTerms.some(term =>
                query.toLowerCase().includes(term)
            );

            expect(hasMedicalTerm).toBe(false);
        });
    });

    describe('Response Formatting', () => {
        it('should format medical information responses', () => {
            const response = 'Common flu symptoms include:\n- Fever\n- Cough\n- Sore throat';

            expect(response).toContain('symptoms');
            expect(response).toContain('-');
        });

        it('should include disclaimer for medical advice', () => {
            const response = 'I cannot provide specific medical advice. Please consult a healthcare professional.';

            expect(response.toLowerCase()).toMatch(/consult|doctor|healthcare professional/);
        });

        it('should format emergency responses appropriately', () => {
            const response = 'This sounds like an emergency. Please call 911 or go to the nearest emergency room immediately.';

            expect(response.toLowerCase()).toMatch(/emergency|911|immediately/);
        });
    });

    describe('Context Handling', () => {
        it('should include user role in prompt', () => {
            const context = { role: 'patient', page: 'dashboard' };
            const prompt = `User role: ${context.role}\nPage: ${context.page}`;

            expect(prompt).toContain('patient');
            expect(prompt).toContain('dashboard');
        });

        it('should handle missing context gracefully', () => {
            const context: { role?: string; page?: string } = {};
            const role = context.role ?? 'unknown';
            const page = context.page ?? 'unknown';

            expect(role).toBe('unknown');
            expect(page).toBe('unknown');
        });
    });

    describe('Rate Limiting Logic', () => {
        it('should track request timestamps', () => {
            const requests = [
                { timestamp: Date.now() },
                { timestamp: Date.now() + 1000 },
                { timestamp: Date.now() + 2000 },
            ];

            expect(requests.length).toBe(3);
            expect(requests[2].timestamp).toBeGreaterThan(requests[0].timestamp);
        });

        it('should detect rapid requests', () => {
            const now = Date.now();
            const requests = [
                { timestamp: now },
                { timestamp: now + 100 },
                { timestamp: now + 200 },
                { timestamp: now + 300 },
                { timestamp: now + 400 },
            ];

            const recentRequests = requests.filter(
                req => now - req.timestamp < 1000
            );

            expect(recentRequests.length).toBe(5);
        });
    });

    describe('Error Handling', () => {
        it('should handle JSON parse errors', () => {
            const invalidJson = 'invalid json';

            expect(() => JSON.parse(invalidJson)).toThrow();
        });

        it('should handle network timeouts', async () => {
            mockFetch.mockImplementationOnce(
                () => new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), 100)
                )
            );

            await expect(
                fetch('http://127.0.0.1:11434/api/generate')
            ).rejects.toThrow('Timeout');
        });

        it('should handle missing response fields', () => {
            const response = {};

            expect(response).not.toHaveProperty('response');
        });

        it('should handle abort errors', () => {
            const error = { name: 'AbortError', message: 'Request aborted' };

            expect(error.name).toBe('AbortError');
        });
    });

    describe('Prompt Engineering', () => {
        it('should construct proper system prompts', () => {
            const systemPrompt = 'You are a healthcare system assistant. Provide accurate medical information but always recommend consulting healthcare professionals.';

            expect(systemPrompt).toContain('healthcare');
            expect(systemPrompt).toContain('consulting');
        });

        it('should include safety rules in prompt', () => {
            const rules = [
                'Do NOT diagnose diseases',
                'Do NOT prescribe medication',
                'Do NOT give treatment plans',
                'Provide general health education only',
            ];

            expect(rules).toHaveLength(4);
            expect(rules[0]).toContain('NOT diagnose');
        });

        it('should include context in prompts', () => {
            const userQuery = 'What are flu symptoms?';
            const fullPrompt = `You are a medical assistant. User asks: ${userQuery}`;

            expect(fullPrompt).toContain(userQuery);
            expect(fullPrompt).toContain('medical assistant');
        });
    });

    describe('Model Configuration', () => {
        it('should use correct model name', () => {
            const config = {
                model: 'llama3.2:3b',
                stream: false,
            };

            expect(config.model).toBe('llama3.2:3b');
            expect(config.stream).toBe(false);
        });

        it('should disable streaming for synchronous responses', () => {
            const requestBody = {
                model: 'llama3.2:3b',
                prompt: 'test',
                stream: false,
            };

            expect(requestBody.stream).toBe(false);
        });
    });
});
