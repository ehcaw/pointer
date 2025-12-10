/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as __tests___helpers_convex_scenarios from "../__tests__/helpers/convex_scenarios.js";
import type * as __tests___helpers_convex_test_utils from "../__tests__/helpers/convex_test_utils.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as graph from "../graph.js";
import type * as http from "../http.js";
import type * as imageReferences from "../imageReferences.js";
import type * as migration from "../migration.js";
import type * as noteVersions from "../noteVersions.js";
import type * as notes from "../notes.js";
import type * as notesContent from "../notesContent.js";
import type * as shared from "../shared.js";
import type * as taskManagement from "../taskManagement.js";
import type * as whiteboards from "../whiteboards.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "__tests__/helpers/convex_scenarios": typeof __tests___helpers_convex_scenarios;
  "__tests__/helpers/convex_test_utils": typeof __tests___helpers_convex_test_utils;
  auth: typeof auth;
  crons: typeof crons;
  graph: typeof graph;
  http: typeof http;
  imageReferences: typeof imageReferences;
  migration: typeof migration;
  noteVersions: typeof noteVersions;
  notes: typeof notes;
  notesContent: typeof notesContent;
  shared: typeof shared;
  taskManagement: typeof taskManagement;
  whiteboards: typeof whiteboards;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
