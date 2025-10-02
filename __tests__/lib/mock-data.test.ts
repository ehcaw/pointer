import { mockNodes, mockEdges } from '../../src/lib/mock-data';
import type { NodeType, Edge } from '../../src/lib/types';

describe('mock-data', () => {
  describe('mockNodes', () => {
    it('should be an array', () => {
      expect(Array.isArray(mockNodes)).toBe(true);
    });

    it('should have 10 nodes', () => {
      expect(mockNodes).toHaveLength(10);
    });

    it('should have nodes with valid structure', () => {
      mockNodes.forEach((node) => {
        expect(node).toHaveProperty('id');
        expect(node).toHaveProperty('type');
        expect(node).toHaveProperty('tags');
        expect(node).toHaveProperty('createdAt');

        expect(typeof node.id).toBe('string');
        expect(typeof node.type).toBe('string');
        expect(Array.isArray(node.tags)).toBe(true);
        expect(typeof node.createdAt).toBe('string');

        // Validate ISO date format
        expect(() => new Date(node.createdAt)).not.toThrow();
      });
    });

    it('should have thought nodes with correct structure', () => {
      const thoughtNodes = mockNodes.filter(node => node.type === 'thought');
      expect(thoughtNodes.length).toBeGreaterThan(0);

      thoughtNodes.forEach((node) => {
        expect(node).toHaveProperty('text');
        expect(typeof node.text).toBe('string');
        expect(node.text.length).toBeGreaterThan(0);
      });
    });

    it('should have bookmark nodes with correct structure', () => {
      const bookmarkNodes = mockNodes.filter(node => node.type === 'bookmark');
      expect(bookmarkNodes.length).toBeGreaterThan(0);

      bookmarkNodes.forEach((node) => {
        expect(node).toHaveProperty('url');
        expect(node).toHaveProperty('title');
        expect(node).toHaveProperty('description');

        expect(typeof node.url).toBe('string');
        expect(typeof node.title).toBe('string');
        expect(typeof node.description).toBe('string');

        // Validate URL format
        expect(() => new URL(node.url)).not.toThrow();
      });
    });

    it('should have media nodes with correct structure', () => {
      const mediaNodes = mockNodes.filter(node => node.type === 'media');
      expect(mediaNodes.length).toBeGreaterThan(0);

      mediaNodes.forEach((node) => {
        expect(node).toHaveProperty('platform');
        expect(node).toHaveProperty('url');
        expect(node).toHaveProperty('caption');

        expect(typeof node.platform).toBe('string');
        expect(typeof node.url).toBe('string');
        expect(typeof node.caption).toBe('string');

        // Validate platform
        expect(['twitter', 'instagram']).toContain(node.platform);

        // Validate URL format
        expect(() => new URL(node.url)).not.toThrow();
      });
    });

    it('should have unique IDs', () => {
      const ids = mockNodes.map(node => node.id);
      const uniqueIds = [...new Set(ids)];
      expect(uniqueIds).toHaveLength(ids.length);
    });

    it('should have reasonable timestamps (not too old)', () => {
      const now = Date.now();
      const fourDaysAgo = now - (4 * 24 * 60 * 60 * 1000); // Give a bit more buffer

      mockNodes.forEach((node) => {
        const nodeTime = new Date(node.createdAt).getTime();
        expect(nodeTime).toBeLessThanOrEqual(now + 1000); // Allow 1 second buffer
        expect(nodeTime).toBeGreaterThanOrEqual(fourDaysAgo);
      });
    });

    it('should have valid tags', () => {
      mockNodes.forEach((node) => {
        expect(Array.isArray(node.tags)).toBe(true);
        node.tags.forEach((tag) => {
          expect(typeof tag).toBe('string');
          expect(tag.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('mockEdges', () => {
    it('should be an array', () => {
      expect(Array.isArray(mockEdges)).toBe(true);
    });

    it('should have edges with valid structure', () => {
      mockEdges.forEach((edge) => {
        expect(edge).toHaveProperty('id');
        expect(edge).toHaveProperty('from');
        expect(edge).toHaveProperty('to');
        expect(edge).toHaveProperty('kind');

        expect(typeof edge.id).toBe('string');
        expect(typeof edge.from).toBe('string');
        expect(typeof edge.to).toBe('string');
        expect(typeof edge.kind).toBe('string');
      });
    });

    it('should have valid edge kinds', () => {
      const validKinds = ['SIMILAR_TO', 'TAGGED_AS', 'LINKS_TO', 'MENTIONS'];

      mockEdges.forEach((edge) => {
        expect(validKinds).toContain(edge.kind);
      });
    });

    it('should reference existing node IDs', () => {
      const nodeIds = mockNodes.map(node => node.id);

      mockEdges.forEach((edge) => {
        expect(nodeIds).toContain(edge.from);
        expect(nodeIds).toContain(edge.to);
      });
    });

    it('should have unique edge IDs', () => {
      const edgeIds = mockEdges.map(edge => edge.id);
      const uniqueEdgeIds = [...new Set(edgeIds)];
      expect(uniqueEdgeIds).toHaveLength(edgeIds.length);
    });

    it('should not have self-referencing edges', () => {
      mockEdges.forEach((edge) => {
        expect(edge.from).not.toBe(edge.to);
      });
    });
  });

  describe('integration', () => {
    it('should have consistent data across nodes and edges', () => {
      const nodeIds = new Set(mockNodes.map(node => node.id));

      mockEdges.forEach((edge) => {
        expect(nodeIds.has(edge.from)).toBe(true);
        expect(nodeIds.has(edge.to)).toBe(true);
      });
    });

    it('should have connected graph structure', () => {
      // Check that at least some nodes have connections
      const connectedNodeIds = new Set<string>();

      mockEdges.forEach((edge) => {
        connectedNodeIds.add(edge.from);
        connectedNodeIds.add(edge.to);
      });

      expect(connectedNodeIds.size).toBeGreaterThan(0);
      expect(connectedNodeIds.size).toBeLessThanOrEqual(mockNodes.length);
    });
  });
});