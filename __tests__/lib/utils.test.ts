import { cn, ensureJSONString } from '../../src/lib/utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
    });

    it('should handle conditional classes', () => {
      expect(cn('px-2', true && 'py-1', false && 'hidden')).toBe('px-2 py-1');
    });

    it('should handle undefined and null values', () => {
      expect(cn('px-2', undefined, null, 'py-1')).toBe('px-2 py-1');
    });

    it('should handle empty strings', () => {
      expect(cn('px-2', '', 'py-1')).toBe('px-2 py-1');
    });

    it('should return empty string when no classes provided', () => {
      expect(cn()).toBe('');
    });

    it('should handle conflicting tailwind classes', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4');
    });
  });

  describe('ensureJSONString', () => {
    it('should return string as-is if it is valid JSON', () => {
      const jsonString = '{"key": "value"}';
      expect(ensureJSONString(jsonString)).toBe(jsonString);
    });

    it('should stringify non-JSON strings', () => {
      const nonJsonString = 'hello world';
      const result = ensureJSONString(nonJsonString);
      expect(result).toBe('"hello world"');
      expect(JSON.parse(result)).toBe('hello world');
    });

    it('should stringify objects', () => {
      const obj = { key: 'value', number: 42 };
      const result = ensureJSONString(obj);
      expect(result).toBe('{"key":"value","number":42}');
      expect(JSON.parse(result)).toEqual(obj);
    });

    it('should stringify arrays', () => {
      const arr = [1, 2, 3];
      const result = ensureJSONString(arr);
      expect(result).toBe('[1,2,3]');
      expect(JSON.parse(result)).toEqual(arr);
    });

    it('should stringify numbers', () => {
      const num = 42;
      const result = ensureJSONString(num);
      expect(result).toBe('42');
      expect(JSON.parse(result)).toBe(42);
    });

    it('should stringify booleans', () => {
      const bool = true;
      const result = ensureJSONString(bool);
      expect(result).toBe('true');
      expect(JSON.parse(result)).toBe(true);
    });

    it('should stringify null', () => {
      const nulled = null;
      const result = ensureJSONString(nulled);
      expect(result).toBe('null');
      expect(JSON.parse(result)).toBe(null);
    });

    it('should handle invalid JSON strings that look like JSON', () => {
      const invalidJson = '{"key": "value"'; // missing closing brace
      const result = ensureJSONString(invalidJson);
      expect(result).toBe('"{\\"key\\": \\"value\\""');
      expect(JSON.parse(result)).toBe(invalidJson);
    });
  });
});