import { vi } from "vitest";

// Mock identity factory
export const createMockIdentity = (overrides = {}) => ({
  subject: "test-user-123",
  tokenIdentifier: "test-token-123",
  name: "Test User",
  pictureUrl: "https://example.com/avatar.jpg",
  email: "test@example.com",
  ...overrides,
});

// Database query chain factory
export const createMockQueryChain = (result = null, shouldThrow = null) => ({
  filter: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      first: vi.fn().mockResolvedValue(result),
      collect: vi.fn().mockResolvedValue(result ? [result] : []),
      take: vi.fn().mockResolvedValue(result ? [result] : []),
      unique: vi.fn().mockResolvedValue(result),
    }),
  }),
  collect: vi.fn().mockResolvedValue(result ? [result] : []),
  first: vi.fn().mockResolvedValue(result),
  unique: vi.fn().mockResolvedValue(result),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
});

// Main Convex context factory
export const createMockConvexContext = (options = {}) => {
  const {
    identity = null,
    queryResults = {},
    shouldAuthThrow = false,
    shouldDbThrow = false,
  } = options;

  return {
    // Auth
    auth: {
      getUserIdentity: shouldAuthThrow
        ? vi.fn().mockRejectedValue(new Error("Auth error"))
        : vi.fn().mockResolvedValue(identity),
      hasPermission: vi.fn(),
      ...options.auth,
    },

    // Database
    db: {
      query: vi.fn((tableName) => {
        const tableResult = queryResults[tableName];
        return createMockQueryChain(
          tableResult,
          shouldDbThrow ? new Error("Database error") : null,
        );
      }),
      get: vi.fn(),
      insert: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      system: vi.fn(),
      ...options.db,
    },

    // Scheduler
    scheduler: {
      runAfter: vi.fn(),
      runAfterJob: vi.fn(),
      cancel: vi.fn(),
      ...options.scheduler,
    },

    // Storage
    storage: {
      getUrl: vi.fn(),
      generateUploadUrl: vi.fn(),
      generateDownloadUrl: vi.fn(),
      delete: vi.fn(),
      ...options.storage,
    },

    // Actions
    actionCtx: {
      runAction: vi.fn(),
      internalAction: vi.fn(),
      ...options.actionCtx,
    },
  };
};
