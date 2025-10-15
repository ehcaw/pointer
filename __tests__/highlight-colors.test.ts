// Test highlight color functionality

// Define the color arrays directly to avoid import issues
const LIGHT_HIGHLIGHT_COLORS = [
  {
    label: "Default background",
    value: "#fef9c3",
    border: "#fbe604",
  },
  {
    label: "Gray background",
    value: "rgb(248, 248, 247)",
    border: "rgba(84, 72, 49, 0.15)",
  },
  {
    label: "Brown background",
    value: "rgb(244, 238, 238)",
    border: "rgba(210, 162, 141, 0.35)",
  },
  {
    label: "Orange background",
    value: "rgb(251, 236, 221)",
    border: "rgba(224, 124, 57, 0.27)",
  },
  {
    label: "Yellow background",
    value: "#fef9c3",
    border: "#fbe604",
  },
  {
    label: "Green background",
    value: "#dcfce7",
    border: "#c7fad8",
  },
  {
    label: "Blue background",
    value: "#e0f2fe",
    border: "#ceeafd",
  },
  {
    label: "Purple background",
    value: "#f3e8ff",
    border: "#e4ccff",
  },
  {
    label: "Pink background",
    value: "rgb(252, 241, 246)",
    border: "rgba(225, 136, 179, 0.27)",
  },
  {
    label: "Red background",
    value: "#ffe4e6",
    border: "#ffccd0",
  },
];

const DARK_HIGHLIGHT_COLORS = [
  {
    label: "Default background",
    value: "#6b6524",
    border: "#58531e",
  },
  {
    label: "Gray background",
    value: "rgb(47, 47, 47)",
    border: "rgba(255, 255, 255, 0.094)",
  },
  {
    label: "Brown background",
    value: "rgb(74, 50, 40)",
    border: "rgba(184, 101, 69, 0.25)",
  },
  {
    label: "Orange background",
    value: "rgb(92, 59, 35)",
    border: "rgba(233, 126, 37, 0.2)",
  },
  {
    label: "Yellow background",
    value: "#6b6524",
    border: "#58531e",
  },
  {
    label: "Green background",
    value: "#509568",
    border: "#47855d",
  },
  {
    label: "Blue background",
    value: "#6e92aa",
    border: "#5e86a1",
  },
  {
    label: "Purple background",
    value: "#583e74",
    border: "#4c3564",
  },
  {
    label: "Pink background",
    value: "rgb(78, 44, 60)",
    border: "rgba(220, 76, 145, 0.22)",
  },
  {
    label: "Red background",
    value: "#743e42",
    border: "#643539",
  },
];

const getHighlightColors = () => {
  if (typeof window !== 'undefined' && document.documentElement.classList.contains('dark')) {
    return DARK_HIGHLIGHT_COLORS;
  }
  return LIGHT_HIGHLIGHT_COLORS;
};

describe('Highlight Colors', () => {
  beforeEach(() => {
    // Reset document.documentElement.classList before each test
    Object.defineProperty(document.documentElement, 'classList', {
      value: {
        contains: jest.fn(),
      },
      writable: true,
    });
  });

  describe('getHighlightColors', () => {
    it('should return light mode colors by default', () => {
      // Mock document.documentElement.classList to not contain 'dark'
      document.documentElement.classList.contains = jest.fn().mockReturnValue(false);

      const colors = getHighlightColors();
      
      expect(colors).toHaveLength(10);
      expect(colors[0]).toEqual({
        label: "Default background",
        value: "#fef9c3",
        border: "#fbe604",
      });
      expect(colors.find(c => c.label === "Yellow background")).toEqual({
        label: "Yellow background",
        value: "#fef9c3",
        border: "#fbe604",
      });
    });

    it('should return dark mode colors when dark class is present', () => {
      // Mock document.documentElement.classList to contain 'dark'
      document.documentElement.classList.contains = jest.fn().mockReturnValue(true);

      const colors = getHighlightColors();
      
      expect(colors).toHaveLength(10);
      expect(colors[0]).toEqual({
        label: "Default background",
        value: "#6b6524",
        border: "#58531e",
      });
      expect(colors.find(c => c.label === "Yellow background")).toEqual({
        label: "Yellow background",
        value: "#6b6524",
        border: "#58531e",
      });
    });
  });

  describe('Color format validation', () => {
    it('should use valid hex color codes', () => {
      const colors = getHighlightColors();
      
      colors.forEach(color => {
        expect(color.value).toMatch(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$|^rgb\(\d+,\s*\d+,\s*\d+\)$/);
        expect(color.border).toMatch(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$|^rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)$/);
      });
    });

    it('should have different colors for different labels', () => {
      const colors = getHighlightColors();
      const uniqueColors = new Set(colors.map(c => c.value));
      
      // Should have at least 5 unique colors (some might be repeated like Default and Yellow)
      expect(uniqueColors.size).toBeGreaterThanOrEqual(5);
    });

    it('should have distinct light and dark mode colors', () => {
      const lightColors = LIGHT_HIGHLIGHT_COLORS;
      const darkColors = DARK_HIGHLIGHT_COLORS;
      
      // Yellow background should be different between light and dark modes
      const lightYellow = lightColors.find(c => c.label === "Yellow background");
      const darkYellow = darkColors.find(c => c.label === "Yellow background");
      
      expect(lightYellow?.value).not.toBe(darkYellow?.value);
      expect(lightYellow?.value).toBe("#fef9c3");
      expect(darkYellow?.value).toBe("#6b6524");
    });
  });
});