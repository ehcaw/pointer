import {
  createMockConvexContext,
  createMockIdentity,
} from "./convex_test_utils";

// Pre-configured contexts for common scenarios
export const convexScenarios = {
  // Unauthenticated user
  unauthenticated: () =>
    createMockConvexContext({
      identity: null,
    }),

  // Authenticated user
  authenticated: (identityOverrides = {}) =>
    createMockConvexContext({
      identity: createMockIdentity(identityOverrides),
    }),

  // Authenticated user with specific data
  withData: (data = {}) =>
    createMockConvexContext({
      identity: createMockIdentity(),
      queryResults: data,
    }),

  // Auth error
  authError: (errorMessage = "Auth error") =>
    createMockConvexContext({
      shouldAuthThrow: true,
    }),

  // Database error
  dbError: (errorMessage = "Database error") =>
    createMockConvexContext({
      identity: createMockIdentity(),
      shouldDbThrow: true,
    }),
};
