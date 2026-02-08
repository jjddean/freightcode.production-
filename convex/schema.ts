// NOTE: If geoRoutes table is already defined elsewhere, remove this duplicate.

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
// Force rebuild 3

import { paymentAttemptSchemaValidator } from "./paymentAttemptTypes";

// Reusable line item schema for detailed price breakdown
const lineItemSchema = v.object({
  category: v.string(), // Origin, Main Transport, Destination, etc.
  description: v.string(),
  unit: v.string(), // wm, shipment, unit
  price: v.number(),
  currency: v.string(),
  minimum: v.optional(v.number()),
  total: v.number(),
  vat: v.optional(v.string()),
});

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    // this the Clerk ID, stored in the subject JWT field
    externalId: v.string(),
    // Multi-tenancy: Clerk Organization ID
    orgId: v.optional(v.union(v.string(), v.null())),
    role: v.optional(v.string()), // "client", "admin", "platform:superadmin"
    subscriptionTier: v.optional(v.string()), // "free", "pro"
    subscriptionStatus: v.optional(v.string()), // "active", "canceled", "past_due"
    stripeCustomerId: v.optional(v.string()),
  }).index("byExternalId", ["externalId"])
    .index("byOrgId", ["orgId"]),

  // Organizations table - synced from Clerk
  organizations: defineTable({
    clerkOrgId: v.string(), // Clerk organization ID
    name: v.string(),
    slug: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdBy: v.optional(v.string()), // Clerk user ID who created it
    membersCount: v.optional(v.number()),
    status: v.optional(v.string()), // "active", "suspended", "terminated"
    subscriptionTier: v.optional(v.string()), // "free", "pro", "enterprise"
    subscriptionStatus: v.optional(v.string()), // "active", "canceled", "past_due"
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("byClerkOrgId", ["clerkOrgId"])
    .index("bySlug", ["slug"]),

  paymentAttempts: defineTable(paymentAttemptSchemaValidator)
    .index("byPaymentId", ["payment_id"])
    .index("byUserId", ["userId"])
    .index("byPayerUserId", ["payer.user_id"]),

  quotes: defineTable({
    // Request details
    origin: v.string(),
    destination: v.string(),
    serviceType: v.string(),
    cargoType: v.string(),
    weight: v.string(),
    dimensions: v.object({
      length: v.string(),
      width: v.string(),
      height: v.string(),
    }),
    value: v.string(),
    incoterms: v.string(),
    urgency: v.string(),
    additionalServices: v.array(v.string()),
    contactInfo: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.string(),
      company: v.string(),
    }),
    // Quote response
    quoteId: v.string(),
    status: v.string(),
    quotes: v.array(v.object({
      carrierId: v.string(),
      carrierName: v.string(),
      serviceType: v.string(),
      transitTime: v.string(),
      price: v.object({
        amount: v.number(),
        currency: v.string(),
        breakdown: v.object({
          baseRate: v.number(),
          fuelSurcharge: v.number(),
          securityFee: v.number(),
          documentation: v.number(),
        }),
        lineItems: v.optional(v.array(lineItemSchema)),
      }),
      validUntil: v.string(),
    })),
    userId: v.optional(v.id("users")),
    guestId: v.optional(v.string()), // DFF: For public quoting
    orgId: v.optional(v.union(v.string(), v.null())), // Multi-tenancy
    createdAt: v.number(),
  }).index("byUserId", ["userId"])
    .index("byQuoteId", ["quoteId"])
    .index("byGuestId", ["guestId"])
    .index("byOrgId", ["orgId"]),

  // DFF: Negotiated Rates
  contracts: defineTable({
    carrier: v.string(), // "Maersk", "MSC"
    origin: v.string(), // UN/LOCODE
    destination: v.string(),
    containerType: v.string(), // "20GP", "40HC"
    price: v.number(),
    currency: v.string(),
    effectiveDate: v.string(),
    expirationDate: v.string(),
    orgId: v.optional(v.union(v.string(), v.null())), // If contract is specific to an Org (optional)
  }).index("byRoute", ["origin", "destination"])
    .index("byCarrier", ["carrier"]),

  // DFF: Carrier API Integrations (Keys)
  integrations: defineTable({
    provider: v.string(), // "project44", "freightos", "vizion"
    apiKey: v.optional(v.string()), // Encrypted or reference
    apiSecret: v.optional(v.string()),
    webhookSecret: v.optional(v.string()),
    status: v.string(), // "active", "inactive"
    orgId: v.optional(v.union(v.string(), v.null())), // If org brings their own keys
  }).index("byProvider", ["provider"])
    .index("byOrgId", ["orgId"]),

  shipments: defineTable({
    shipmentId: v.string(),
    status: v.string(),
    currentLocation: v.object({
      city: v.string(),
      state: v.string(),
      country: v.string(),
      coordinates: v.object({
        lat: v.number(),
        lng: v.number(),
      }),
    }),
    estimatedDelivery: v.string(),
    carrier: v.string(),
    trackingNumber: v.string(),
    service: v.string(),
    shipmentDetails: v.object({
      weight: v.string(),
      dimensions: v.string(),
      origin: v.string(),
      destination: v.string(),
      value: v.string(),
    }),
    // Compliance & Risk Fields
    riskLevel: v.optional(v.string()), // "low", "medium", "high"
    flaggedBy: v.optional(v.string()), // User ID of admin who flagged it
    flagReason: v.optional(v.string()),

    // DFF MVP: Customs Integrations
    customs: v.optional(v.object({
      brokerName: v.optional(v.string()), // e.g. "Flexport Customs LLC"
      brokerEmail: v.optional(v.string()),
      filingStatus: v.optional(v.string()), // "pending", "filed", "cleared", "held"
      entryNumber: v.optional(v.string()), // 7501 Entry Number
      clearedAt: v.optional(v.number()),
    })),

    userId: v.optional(v.id("users")),
    orgId: v.optional(v.union(v.string(), v.null())), // Multi-tenancy
    lastUpdated: v.number(),
    createdAt: v.number(),
  }).index("byUserId", ["userId"])
    .index("byShipmentId", ["shipmentId"])
    .index("byTrackingNumber", ["trackingNumber"])
    .index("byOrgId", ["orgId"]),

  trackingEvents: defineTable({
    shipmentId: v.id("shipments"),
    timestamp: v.string(),
    status: v.string(),
    location: v.string(),
    description: v.string(),
    createdAt: v.number(),
  }).index("byShipmentId", ["shipmentId"])
    .index("byTimestamp", ["timestamp"]),

  bookings: defineTable({
    bookingId: v.string(),
    quoteId: v.string(),
    carrierQuoteId: v.string(),
    carrierName: v.optional(v.string()),
    serviceType: v.optional(v.string()),
    carrierLogo: v.optional(v.string()),
    status: v.string(), // "pending", "pending_approval", "approved", "confirmed", "in_transit", "delivered", "cancelled", "rejected"
    customerDetails: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.string(),
      company: v.string(),
    }),
    paymentStatus: v.optional(v.string()), // "unpaid", "paid", "refunded"
    pickupDetails: v.object({
      address: v.string(),
      date: v.string(),
      timeWindow: v.string(),
      contactPerson: v.string(),
      contactPhone: v.string(),
    }),
    deliveryDetails: v.object({
      address: v.string(),
      date: v.string(),
      timeWindow: v.string(),
      contactPerson: v.string(),
      contactPhone: v.string(),
    }),
    specialInstructions: v.optional(v.string()),
    notes: v.optional(v.string()),
    // Price snapshot
    price: v.optional(v.object({
      amount: v.number(),
      currency: v.string(),
      breakdown: v.optional(v.object({
        baseRate: v.number(),
        fuelSurcharge: v.number(),
        securityFee: v.number(),
        documentation: v.number(),
      })),
      lineItems: v.optional(v.array(lineItemSchema)),
    })),
    // Approval workflow fields
    requiresApproval: v.optional(v.boolean()), // True if needs platform approval
    approvalStatus: v.optional(v.string()), // "pending", "approved", "rejected"
    approvedBy: v.optional(v.string()), // Clerk user ID of approver
    approvedAt: v.optional(v.number()), // Timestamp of approval
    rejectionReason: v.optional(v.string()), // Reason if rejected
    userId: v.optional(v.id("users")),
    orgId: v.optional(v.union(v.string(), v.null())), // Multi-tenancy
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("byUserId", ["userId"])
    .index("byBookingId", ["bookingId"])
    .index("byQuoteId", ["quoteId"])
    .index("byOrgId", ["orgId"])
    .index("byApprovalStatus", ["approvalStatus"]),

  documents: defineTable({
    type: v.string(), // "bill_of_lading", "air_waybill", "commercial_invoice"
    bookingId: v.optional(v.string()),
    shipmentId: v.optional(v.string()),
    documentData: v.object({
      documentNumber: v.string(),
      issueDate: v.string(),
      parties: v.object({
        shipper: v.object({
          name: v.string(),
          address: v.string(),
          contact: v.string(),
        }),
        consignee: v.object({
          name: v.string(),
          address: v.string(),
          contact: v.string(),
        }),
        carrier: v.optional(v.object({
          name: v.string(),
          address: v.string(),
          contact: v.string(),
        })),
      }),
      cargoDetails: v.object({
        description: v.string(),
        weight: v.string(),
        dimensions: v.string(),
        value: v.string(),
        hsCode: v.optional(v.string()),
      }),
      routeDetails: v.object({
        origin: v.string(),
        destination: v.string(),
        portOfLoading: v.optional(v.string()),
        portOfDischarge: v.optional(v.string()),
      }),
      terms: v.optional(v.string()),
    }),
    status: v.string(), // "draft", "issued", "acknowledged", "archived"
    // New: DocuSign envelope metadata
    docusign: v.optional(v.object({
      envelopeId: v.string(),
      status: v.string(), // sent | completed | voided | declined | created
      lastUpdated: v.number(),
      recipients: v.optional(v.array(v.object({
        email: v.string(),
        name: v.string(),
        role: v.optional(v.string()),
        recipientId: v.optional(v.string()),
        status: v.optional(v.string()),
      }))),
    })),
    userId: v.optional(v.id("users")),
    orgId: v.optional(v.union(v.string(), v.null())), // Multi-tenancy
    uploadedBy: v.optional(v.string()), // "client" | "system" - for hybrid model
    shareToken: v.optional(v.string()), // For public sharing
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("byUserId", ["userId"])
    .index("byType", ["type"])
    .index("byBookingId", ["bookingId"])
    .index("byShipmentId", ["shipmentId"])
    .index("byShareToken", ["shareToken"])
    .index("byOrgId", ["orgId"]),

  geoRoutes: defineTable({
    key: v.string(),
    origin: v.string(),
    dest: v.string(),
    profile: v.string(),
    points: v.array(v.object({ lat: v.number(), lng: v.number() })),
    distance: v.optional(v.number()),
    duration: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    expiresAt: v.optional(v.number()),
  }).index("byKey", ["key"]),

  invoices: defineTable({
    invoiceNumber: v.string(),
    bookingId: v.id("bookings"),
    customerId: v.optional(v.id("users")),
    amount: v.number(),
    currency: v.string(),
    status: v.string(), // "pending", "paid", "overdue", "void"
    dueDate: v.string(),
    route: v.optional(v.string()),
    items: v.array(v.object({
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      total: v.number(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
    orgId: v.optional(v.union(v.string(), v.null())), // Multi-tenancy
  }).index("byBookingId", ["bookingId"])
    .index("byCustomerId", ["customerId"])
    .index("byInvoiceNumber", ["invoiceNumber"])
    .index("byOrgId", ["orgId"]),

  // Audit logs for compliance tracking
  auditLogs: defineTable({
    action: v.string(), // "booking.created", "document.signed", "user.login", etc.
    entityType: v.string(), // "booking", "document", "shipment", "user"
    entityId: v.optional(v.string()), // ID of the affected entity
    userId: v.optional(v.string()), // Clerk user ID who performed the action
    userEmail: v.optional(v.string()), // Email of the user
    orgId: v.optional(v.union(v.string(), v.null())), // Organization context
    details: v.optional(v.any()), // Additional metadata (JSON)
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    timestamp: v.number(),
  }).index("byAction", ["action"])
    .index("byEntityType", ["entityType"])
    .index("byUserId", ["userId"])
    .index("byOrgId", ["orgId"])
    .index("byTimestamp", ["timestamp"]),

  notifications: defineTable({
    userId: v.optional(v.string()), // Clerk User ID
    title: v.string(),
    message: v.string(),
    type: v.string(), // shipment, payment, document, system
    priority: v.string(), // low, medium, high
    read: v.boolean(),
    actionUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("byUserId", ["userId"])
    .index("byRead", ["read"]),

  kycVerifications: defineTable({
    userId: v.string(), // Clerk User ID
    orgId: v.optional(v.union(v.string(), v.null())),
    status: v.string(), // "draft", "submitted", "verified", "rejected"
    step: v.number(), // Current progress step (1, 2, 3...)

    // Step 1: Business Details
    companyName: v.optional(v.string()),
    registrationNumber: v.optional(v.string()),
    vatNumber: v.optional(v.string()),
    country: v.optional(v.string()),

    // Step 2: Documents
    documents: v.array(v.object({
      type: v.string(), // "incorporation_cert", "id_proof"
      fileUrl: v.string(),
      fileId: v.optional(v.string()), // Convex storage ID if needed later
      uploadedAt: v.number(),
    })),

    // Metadata
    submittedAt: v.optional(v.number()),
    verifiedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  }).index("byUserId", ["userId"])
    .index("byOrgId", ["orgId"])
    .index("byStatus", ["status"]),

  waitlist: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    company: v.optional(v.string()),
    role: v.optional(v.string()), // "freight_forwarder", "importer", "exporter", "other"
    status: v.string(), // "pending", "invited", "joined"
    source: v.optional(v.string()), // utm_source, referrer, etc.
    referralCode: v.optional(v.string()),
    referredBy: v.optional(v.string()), // Code of the referrer
    referrals: v.optional(v.number()),
    invitedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("byEmail", ["email"])
    .index("byStatus", ["status"])
    .index("byReferralCode", ["referralCode"]),
  apiKeys: defineTable({
    key: v.string(),
    userId: v.string(),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
    name: v.optional(v.string()),
    lastUsedAt: v.optional(v.number()),
    status: v.string(), // "active", "revoked"
  }).index("by_user", ["userId"])
    .index("by_key", ["key"]),
  contacts: defineTable({
    name: v.string(),
    email: v.string(),
    company: v.optional(v.string()),
    phone: v.optional(v.string()),
    userId: v.optional(v.string()), // Clerk User ID (Owner)
    orgId: v.optional(v.union(v.string(), v.null())), // Multi-tenancy
    createdAt: v.number(),
  }).index("byUserId", ["userId"])
    .index("byOrgId", ["orgId"]),

  messages: defineTable({
    body: v.string(),
    userId: v.string(), // Conversation ID (The Client's User ID)
    sender: v.string(), // "user" | "admin"
    read: v.boolean(),
    timestamp: v.number(),
    archived: v.optional(v.boolean()),
  }).index("byUserId", ["userId"])
    .index("byTimestamp", ["timestamp"])
    .index("byRead", ["read"]), // Efficiently find unread messages
}); 
