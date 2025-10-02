// Test utility functions from collaborative editor

// Helper function to generate consistent user colors (extracted from component)
const generateUserColor = (userId: string): string => {
  const colors = [
    "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4",
    "#ffeaa7", "#dda0dd", "#98d8c8", "#ff7f50",
    "#74b9ff", "#a29bfe", "#fd79a8", "#fdcb6e"
  ];

  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

// Helper function to extract email prefix (extracted from component)
const getEmailPrefix = (email: string) => {
  return email.split("@")[0];
};

describe('Collaborative Editor Utils', () => {
  describe('generateUserColor', () => {
    it('should generate consistent colors for the same user ID', () => {
      const userId = 'user-123';
      const color1 = generateUserColor(userId);
      const color2 = generateUserColor(userId);

      expect(color1).toBe(color2);
    });

    it('should generate different colors for different user IDs', () => {
      const userId1 = 'user-123';
      const userId2 = 'user-456';

      const color1 = generateUserColor(userId1);
      const color2 = generateUserColor(userId2);

      expect(color1).not.toBe(color2);
    });

    it('should return valid hex colors', () => {
      const userId = 'test-user';
      const color = generateUserColor(userId);

      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('should handle empty string user ID', () => {
      const color = generateUserColor('');

      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('should handle special characters in user ID', () => {
      const userId = 'user-with-special-chars-@#$%';
      const color = generateUserColor(userId);

      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  describe('getEmailPrefix', () => {
    it('should extract text before @ symbol', () => {
      const email = 'ryannguyenc@gmail.com';
      const prefix = getEmailPrefix(email);

      expect(prefix).toBe('ryannguyenc');
    });

    it('should handle different email domains', () => {
      const testCases = [
        { email: 'john.doe@yahoo.com', expected: 'john.doe' },
        { email: 'jane_smith@outlook.com', expected: 'jane_smith' },
        { email: 'user123@company.co.uk', expected: 'user123' },
        { email: 'test@subdomain.example.org', expected: 'test' }
      ];

      testCases.forEach(({ email, expected }) => {
        const result = getEmailPrefix(email);
        expect(result).toBe(expected);
      });
    });

    it('should handle emails without @ symbol', () => {
      const email = 'plainstring';
      const prefix = getEmailPrefix(email);

      expect(prefix).toBe('plainstring');
    });

    it('should handle empty email', () => {
      const email = '';
      const prefix = getEmailPrefix(email);

      expect(prefix).toBe('');
    });

    it('should handle emails starting with @', () => {
      const email = '@domain.com';
      const prefix = getEmailPrefix(email);

      expect(prefix).toBe('');
    });

    it('should handle emails with multiple @ symbols', () => {
      const email = 'test@other@domain.com';
      const prefix = getEmailPrefix(email);

      expect(prefix).toBe('test');
    });
  });
});