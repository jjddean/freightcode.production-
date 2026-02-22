/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as admin_seed from "../admin_seed.js";
import type * as ai from "../ai.js";
import type * as auditLogs from "../auditLogs.js";
import type * as authHelpers from "../authHelpers.js";
import type * as backfill from "../backfill.js";
import type * as billing from "../billing.js";
import type * as bookings from "../bookings.js";
import type * as carriers from "../carriers.js";
import type * as clerk from "../clerk.js";
import type * as compliance from "../compliance.js";
import type * as contacts from "../contacts.js";
import type * as crons from "../crons.js";
import type * as customs from "../customs.js";
import type * as debug from "../debug.js";
import type * as debug_crash from "../debug_crash.js";
import type * as debug_email from "../debug_email.js";
import type * as developer from "../developer.js";
import type * as diagnostic from "../diagnostic.js";
import type * as docmate from "../docmate.js";
import type * as docmate_db from "../docmate_db.js";
import type * as documents from "../documents.js";
import type * as docusign from "../docusign.js";
import type * as email from "../email.js";
import type * as emails from "../emails.js";
import type * as freightintel_build_profiles from "../freightintel/build_profiles.js";
import type * as freightintel_constants from "../freightintel/constants.js";
import type * as freightintel_ingest_usa_ams from "../freightintel/ingest_usa_ams.js";
import type * as freightintel_internal from "../freightintel/internal.js";
import type * as freightintel_maintenance from "../freightintel/maintenance.js";
import type * as freightintel_management from "../freightintel/management.js";
import type * as freightintel_mutations from "../freightintel/mutations.js";
import type * as freightintel_queries from "../freightintel/queries.js";
import type * as freightintel_test from "../freightintel/test.js";
import type * as freightos from "../freightos.js";
import type * as geo from "../geo.js";
import type * as georisk from "../georisk.js";
import type * as hmrc_actions from "../hmrc_actions.js";
import type * as http from "../http.js";
import type * as integrations from "../integrations.js";
import type * as invoices from "../invoices.js";
import type * as lib_TextractExtractor from "../lib/TextractExtractor.js";
import type * as locations from "../locations.js";
import type * as marketing from "../marketing.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as organizations from "../organizations.js";
import type * as paymentAttemptTypes from "../paymentAttemptTypes.js";
import type * as paymentAttempts from "../paymentAttempts.js";
import type * as payments from "../payments.js";
import type * as paymentsData from "../paymentsData.js";
import type * as pdfGenerator from "../pdfGenerator.js";
import type * as pricing from "../pricing.js";
import type * as quotes from "../quotes.js";
import type * as repair from "../repair.js";
import type * as reporting from "../reporting.js";
import type * as search from "../search.js";
import type * as shipments from "../shipments.js";
import type * as simulation from "../simulation.js";
import type * as smartaudit from "../smartaudit.js";
import type * as smartaudit_auditor from "../smartaudit_auditor.js";
import type * as stripe from "../stripe.js";
import type * as subscriptions from "../subscriptions.js";
import type * as testing from "../testing.js";
import type * as textractTest from "../textractTest.js";
import type * as upload from "../upload.js";
import type * as users from "../users.js";
import type * as workflows from "../workflows.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  admin_seed: typeof admin_seed;
  ai: typeof ai;
  auditLogs: typeof auditLogs;
  authHelpers: typeof authHelpers;
  backfill: typeof backfill;
  billing: typeof billing;
  bookings: typeof bookings;
  carriers: typeof carriers;
  clerk: typeof clerk;
  compliance: typeof compliance;
  contacts: typeof contacts;
  crons: typeof crons;
  customs: typeof customs;
  debug: typeof debug;
  debug_crash: typeof debug_crash;
  debug_email: typeof debug_email;
  developer: typeof developer;
  diagnostic: typeof diagnostic;
  docmate: typeof docmate;
  docmate_db: typeof docmate_db;
  documents: typeof documents;
  docusign: typeof docusign;
  email: typeof email;
  emails: typeof emails;
  "freightintel/build_profiles": typeof freightintel_build_profiles;
  "freightintel/constants": typeof freightintel_constants;
  "freightintel/ingest_usa_ams": typeof freightintel_ingest_usa_ams;
  "freightintel/internal": typeof freightintel_internal;
  "freightintel/maintenance": typeof freightintel_maintenance;
  "freightintel/management": typeof freightintel_management;
  "freightintel/mutations": typeof freightintel_mutations;
  "freightintel/queries": typeof freightintel_queries;
  "freightintel/test": typeof freightintel_test;
  freightos: typeof freightos;
  geo: typeof geo;
  georisk: typeof georisk;
  hmrc_actions: typeof hmrc_actions;
  http: typeof http;
  integrations: typeof integrations;
  invoices: typeof invoices;
  "lib/TextractExtractor": typeof lib_TextractExtractor;
  locations: typeof locations;
  marketing: typeof marketing;
  messages: typeof messages;
  notifications: typeof notifications;
  organizations: typeof organizations;
  paymentAttemptTypes: typeof paymentAttemptTypes;
  paymentAttempts: typeof paymentAttempts;
  payments: typeof payments;
  paymentsData: typeof paymentsData;
  pdfGenerator: typeof pdfGenerator;
  pricing: typeof pricing;
  quotes: typeof quotes;
  repair: typeof repair;
  reporting: typeof reporting;
  search: typeof search;
  shipments: typeof shipments;
  simulation: typeof simulation;
  smartaudit: typeof smartaudit;
  smartaudit_auditor: typeof smartaudit_auditor;
  stripe: typeof stripe;
  subscriptions: typeof subscriptions;
  testing: typeof testing;
  textractTest: typeof textractTest;
  upload: typeof upload;
  users: typeof users;
  workflows: typeof workflows;
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
