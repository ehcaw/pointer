/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as graph from "../graph.js";
import type * as http from "../http.js";
import type * as imageReferences from "../imageReferences.js";
import type * as migration from "../migration.js";
import type * as notes from "../notes.js";
import type * as notesContent from "../notesContent.js";
import type * as shared from "../shared.js";
import type * as taskManagement from "../taskManagement.js";
import type * as whiteboards from "../whiteboards.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  crons: typeof crons;
  graph: typeof graph;
  http: typeof http;
  imageReferences: typeof imageReferences;
  migration: typeof migration;
  notes: typeof notes;
  notesContent: typeof notesContent;
  shared: typeof shared;
  taskManagement: typeof taskManagement;
  whiteboards: typeof whiteboards;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
