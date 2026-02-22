import { query, mutation, internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const getDashboardStats = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            // For now, allow public access for demo purposes
        }

        const bookings = await ctx.db.query("bookings").collect();
        const shipments = await ctx.db.query("shipments").collect();
        const users = await ctx.db.query("users").collect();

        const totalBookings = bookings.length;
        const pendingApprovals = bookings.filter(b => b.status === 'pending' || b.status === 'quote_received').length;
        const activeShipments = shipments.filter(s => s.status === 'In Transit' || s.status === 'in_transit').length;
        const totalCustomers = users.length;

        return {
            totalBookings,
            activeShipments,
            totalCustomers,
            pendingApprovals,
            trends: {
                bookings: "+12.5%",
                shipments: "+4",
                customers: "+8.2%",
                approvals: pendingApprovals > 0 ? "+1" : "0"
            }
        };
    },
});

export const listAllBookings = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("bookings").order("desc").collect();
    }
});

export const listAllShipments = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("shipments").order("desc").collect();
    }
});

export const getRecentActivity = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("auditLogs")
            .order("desc")
            .take(20);
    }
});

export const getPendingActions = query({
    args: {},
    handler: async (ctx) => {
        const bookings = await ctx.db
            .query("bookings")
            .withIndex("byApprovalStatus", (q) => q.eq("approvalStatus", "pending"))
            .collect();

        const kyc = await ctx.db
            .query("kycVerifications")
            .withIndex("byStatus", (q) => q.eq("status", "submitted"))
            .collect();

        const allDocs = await ctx.db.query("documents").collect();
        const pendingDocs = allDocs.filter(d => d.status === "pending_review");

        const allPayments = await ctx.db.query("paymentAttempts").collect();
        const pendingPayments = allPayments.filter(p => p.status === 'failed' || p.status === 'requires_action');

        const actions = [
            ...bookings.map(b => ({
                id: b._id,
                type: 'booking',
                priority: 'high',
                title: `Booking Approval: ${b.bookingId}`,
                subtitle: `${b.customerDetails?.company || 'Unknown'} - ${b.pickupDetails?.address?.split(',')[0]} -> ${b.deliveryDetails?.address?.split(',')[0]}`,
                createdAt: b.createdAt,
                status: 'pending'
            })),
            ...kyc.map(k => ({
                id: k._id,
                type: 'kyc',
                priority: 'critical',
                title: `KYC Verification: ${k.companyName}`,
                subtitle: `Reg: ${k.registrationNumber} (${k.country})`,
                createdAt: k.submittedAt || k._creationTime,
                status: 'submitted'
            })),
            ...pendingDocs.map(d => ({
                id: d._id,
                type: 'document',
                priority: 'medium',
                title: `Document Review: ${d.type}`,
                subtitle: `Ref: ${d.documentData?.documentNumber}`,
                createdAt: d.updatedAt || d.createdAt,
                status: 'pending_review'
            })),
            ...pendingPayments.map(p => ({
                id: p._id,
                type: 'payment',
                priority: 'high',
                title: `Payment Issue: ${p.invoice_id}`,
                subtitle: `Amount: ${p.totals?.grand_total?.amount_formatted || 'Unknown'} - ${p.status}`,
                createdAt: p.created_at,
                status: p.status
            }))
        ];

        return actions.sort((a, b) => b.createdAt - a.createdAt);
    }
});

export const listWaitlist = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("waitlist").order("desc").collect();
    }
});

export const approveWaitlistUser = mutation({
    args: { id: v.id("waitlist") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            status: "invited",
            invitedAt: Date.now()
        });

        const entry = await ctx.db.get(args.id);
        if (entry) {
            const identity = await ctx.auth.getUserIdentity();
            await ctx.db.insert("auditLogs", {
                action: "waitlist.invited",
                entityType: "waitlist",
                entityId: args.id,
                userId: identity?.subject || "admin",
                details: { email: entry.email },
                timestamp: Date.now()
            });
        }
    }
});

export const getAuditLogs = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("auditLogs").order("desc").take(100);
    }
});

export const listUsers = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("users").order("desc").collect();
    }
});

export const listOrganizations = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("organizations").order("desc").collect();
    }
});

export const listAllDocuments = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("documents").order("desc").collect();
    }
});

export const verifySystemState = internalAction({
    args: {},
    handler: async (ctx) => {
        const bookings = await ctx.runQuery(api.admin.listAllBookings, {});
        // Fallback for missing query if any
        let pending = [];
        try {
            pending = await ctx.runQuery(api.bookings.listPendingApprovals, {});
        } catch (e) { console.log("Pending query missing"); }

        const report: string[] = [];
        report.push("=== SYSTEM VERIFICATION REPORT ===");
        report.push(`Total Bookings: ${bookings.length}`);
        report.push(`Pending Approvals: ${pending.length}`);

        if (bookings.length > 0) {
            const latest = bookings[0];
            report.push(`Latest Booking: ${latest.bookingId} | Status: ${latest.status} | Paid: ${latest.paymentStatus || 'pending'}`);
        }
        return report;
    }
});

export const seedTestBooking = internalMutation({
    args: {},
    handler: async (ctx) => {
        const quoteId = "QT-TEST-" + Date.now();
        return await ctx.db.insert("bookings", {
            bookingId: "BK-TEST-" + Date.now(),
            quoteId: quoteId,
            carrierQuoteId: "rate-test-1",
            status: "pending",
            approvalStatus: "pending",
            customerDetails: {
                name: "Test User",
                email: "test@example.com",
                phone: "555-0199",
                company: "Test Corp"
            },
            pickupDetails: {
                address: "Shanghai, CN",
                date: "2026-03-01",
                timeWindow: "09:00-11:00",
                contactPerson: "Shipper",
                contactPhone: "123"
            },
            deliveryDetails: {
                address: "Los Angeles, US",
                date: "2026-03-20",
                timeWindow: "09:00-11:00",
                contactPerson: "Receiver",
                contactPhone: "456"
            },
            price: {
                amount: 5000,
                currency: "USD"
            },
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
    }
});

export const seedContracts = internalMutation({
    args: {},
    handler: async (ctx) => {
        const existing = await ctx.db.query("contracts").collect();
        for (const c of existing) await ctx.db.delete(c._id);

        await ctx.db.insert("contracts", {
            carrier: "Maersk",
            origin: "CNSHA",
            destination: "USLAX",
            containerType: "40HC",
            price: 2200,
            currency: "USD",
            effectiveDate: "2026-01-01",
            expirationDate: "2026-12-31"
        });

        return "Seeded Contracts";
    }
});
