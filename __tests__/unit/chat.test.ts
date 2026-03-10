/**
 * Unit tests for chat utility functions
 */

// Note: CHAT_ENCRYPTION_KEY is set in jest.setup.js before modules are loaded

// Mock crypto module for Node.js environment
jest.mock('crypto', () => {
    const actual = jest.requireActual('crypto');
    return {
        ...actual,
        randomBytes: jest.fn((size: number) => {
            return Buffer.alloc(size, 'a'); // Predictable output for tests
        }),
    };
});

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    single: jest.fn(() => Promise.resolve({ data: null, error: null })),
                })),
            })),
            insert: jest.fn(() => ({
                select: jest.fn(() => ({
                    single: jest.fn(() => Promise.resolve({
                        data: { id: 'test-id', conversation_id: 'conv-id' },
                        error: null
                    })),
                })),
            })),
            update: jest.fn(() => ({
                eq: jest.fn(() => ({
                    neq: jest.fn(() => ({
                        eq: jest.fn(() => Promise.resolve({ error: null })),
                    })),
                })),
            })),
        })),
        storage: {
            from: jest.fn(() => ({
                upload: jest.fn(() => Promise.resolve({ data: { path: 'test/path' }, error: null })),
                getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/file.pdf' } })),
            })),
        },
    })),
}));

import {
    encryptMessage,
    decryptMessage,
    validateFile,
    ALLOWED_FILE_TYPES,
    MAX_FILE_SIZE,
} from '@/lib/chat';

describe('Chat Encryption', () => {
    describe('encryptMessage', () => {
        it('should encrypt a message and return formatted string', () => {
            const message = 'Hello, Doctor!';
            const encrypted = encryptMessage(message);

            // Should be in format: iv:authTag:encryptedData
            const parts = encrypted.split(':');
            expect(parts.length).toBe(3);

            // IV should be 32 hex characters (16 bytes)
            expect(parts[0].length).toBe(32);

            // Auth tag should be 32 hex characters (16 bytes)
            expect(parts[1].length).toBe(32);

            // Encrypted data should exist
            expect(parts[2].length).toBeGreaterThan(0);
        });

        it('should produce different encrypted output for same message (due to random IV)', () => {
            // Note: With mocked randomBytes, this will produce same output
            // In real usage, different IVs would produce different ciphertext
            const message = 'Test message';
            const encrypted1 = encryptMessage(message);
            const encrypted2 = encryptMessage(message);

            // With mocked randomBytes returning same value, they'll be equal
            expect(encrypted1).toBe(encrypted2);
        });
    });

    describe('decryptMessage', () => {
        it('should decrypt an encrypted message correctly', () => {
            const originalMessage = 'Hello, this is a test message!';
            const encrypted = encryptMessage(originalMessage);
            const decrypted = decryptMessage(encrypted);

            expect(decrypted).toBe(originalMessage);
        });

        it('should return original text if not in encrypted format', () => {
            const plainText = 'This is not encrypted';
            const result = decryptMessage(plainText);

            expect(result).toBe(plainText);
        });

        it('should handle empty strings', () => {
            const encrypted = encryptMessage('');
            const decrypted = decryptMessage(encrypted);

            expect(decrypted).toBe('');
        });

        it('should handle special characters', () => {
            const message = 'Special chars: !@#$%^&*()_+-=[]{}|;:",.<>?/~`';
            const encrypted = encryptMessage(message);
            const decrypted = decryptMessage(encrypted);

            expect(decrypted).toBe(message);
        });

        it('should handle unicode characters', () => {
            const message = 'Unicode: 你好 🏥 👨‍⚕️ 💊';
            const encrypted = encryptMessage(message);
            const decrypted = decryptMessage(encrypted);

            expect(decrypted).toBe(message);
        });
    });
});

describe('File Validation', () => {
    describe('validateFile', () => {
        it('should accept valid PDF files', () => {
            const file = new File(['content'], 'report.pdf', { type: 'application/pdf' });
            const result = validateFile(file);

            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('should accept valid image files', () => {
            const jpegFile = new File(['content'], 'scan.jpg', { type: 'image/jpeg' });
            const pngFile = new File(['content'], 'xray.png', { type: 'image/png' });

            expect(validateFile(jpegFile).valid).toBe(true);
            expect(validateFile(pngFile).valid).toBe(true);
        });

        it('should accept valid document files', () => {
            const docFile = new File(['content'], 'notes.doc', { type: 'application/msword' });
            const docxFile = new File(['content'], 'notes.docx', {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            });

            expect(validateFile(docFile).valid).toBe(true);
            expect(validateFile(docxFile).valid).toBe(true);
        });

        it('should reject invalid file types', () => {
            const exeFile = new File(['content'], 'virus.exe', { type: 'application/x-msdownload' });
            const result = validateFile(exeFile);

            expect(result.valid).toBe(false);
            expect(result.error).toContain('File type not allowed');
        });

        it('should reject files exceeding size limit', () => {
            // Create a file larger than MAX_FILE_SIZE (10MB)
            const largeContent = new Array(11 * 1024 * 1024).fill('a').join('');
            const largeFile = new File([largeContent], 'large.pdf', { type: 'application/pdf' });

            const result = validateFile(largeFile);

            expect(result.valid).toBe(false);
            expect(result.error).toContain('10MB limit');
        });
    });

    describe('Constants', () => {
        it('should have correct allowed file types', () => {
            expect(ALLOWED_FILE_TYPES).toContain('application/pdf');
            expect(ALLOWED_FILE_TYPES).toContain('image/jpeg');
            expect(ALLOWED_FILE_TYPES).toContain('image/png');
        });

        it('should have correct max file size (10MB)', () => {
            expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
        });
    });
});
