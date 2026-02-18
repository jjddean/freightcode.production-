import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const userId = identity.subject;

        return await ctx.db
            .query("notifications")
            .withIndex("byUserId", (q) => q.eq("userId", userId))
            .order("desc")
            .take(args.limit || 50);
    },
});

export const create = mutation({
    args: {
        title: v.string(),
        message: v.string(),
        type: v.string(),
        priority: v.string(),
        actionUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const userId = identity.subject;

        await ctx.db.insert("notifications", {
            userId,
            title: args.title,
            message: args.message,
            type: args.type,
            priority: args.priority,
            read: false,
            actionUrl: args.actionUrl,
            createdAt: Date.now(),
        });
    },
});

export const markRead = mutation({
    args: {
        notificationId: v.id("notifications"),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.notificationId, { read: true });
    },
});

export const getUnreadCount = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        const userId = identity.subject;

        const unread = await ctx.db
            .query("notifications")
            .withIndex("byUserId", (q) => q.eq("userId", userId))
            .filter(q => q.eq(q.field("read"), false))
            .collect();

        return unread.length;
    }
});

export const markAllRead = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;
        const userId = identity.subject;

        // Fetch unread in batches if possible, but collect is usually fine up to 10k
        const notifications = await ctx.db
            .query("notifications")
            .withIndex("byUserId", (q) => q.eq("userId", userId))
            .filter(q => q.eq(q.field("read"), false))
            .collect();

        // Audit log for mass update (optional but good for tracking)
        console.log(`Marking ${notifications.length} notifications as read for ${userId}`);

        for (const notification of notifications) {
            await ctx.db.patch(notification._id, { read: true });
        }
    }
});

// Helper for other mutations to call internally
// Helper for other mutations to call internally
export async function createNotificationHelper(
    ctx: MutationCtx,
    userId: string,
    data: { title: string; message: string; type: string; priority: string; actionUrl?: string }
) {
    if (!userId) return;
    await ctx.db.insert("notifications", {
        userId,
        title: data.title,
        message: data.message,
        type: data.type,
        priority: data.priority,
        actionUrl: data.actionUrl,
        read: false,
        createdAt: Date.now(),
    });
}
