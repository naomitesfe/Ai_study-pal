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
import type * as admin from "../admin.js";
import type * as ai from "../ai.js";
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as notes from "../notes.js";
import type * as notifications from "../notifications.js";
import type * as payments from "../payments.js";
import type * as profiles from "../profiles.js";
import type * as router from "../router.js";
import type * as tutoring from "../tutoring.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  ai: typeof ai;
  analytics: typeof analytics;
  auth: typeof auth;
  http: typeof http;
  notes: typeof notes;
  notifications: typeof notifications;
  payments: typeof payments;
  profiles: typeof profiles;
  router: typeof router;
  tutoring: typeof tutoring;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
