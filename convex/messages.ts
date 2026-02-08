import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Send a message
export const send = mutation({
    args: {
        body: v.string(),
        userId: v.string(), // The "Conversation ID"
        sender: v.string(), // "user" or "admin"
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("messages", {
            body: args.body,
            userId: args.userId,
            sender: args.sender,
            read: false,
            timestamp: Date.now(),
        });
    },
});

// List messages for a conversation (excluding archived)
export const list = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("messages")
            .withIndex("byUserId", (q) => q.eq("userId", args.userId))
            .filter((q) => q.neq(q.field("archived"), true)) // Hide archived
            .order("asc")
            .collect();
    },
});

export const listConversations = query({
    handler: async (ctx) => {
        const messages = await ctx.db
            .query("messages")
            .withIndex("byTimestamp")
            .order("desc")
            .filter((q) => q.neq(q.field("archived"), true)) // Hide archived
            .take(100);

        const conversationsMap = new Map();

        for (const msg of messages) {
            if (!conversationsMap.has(msg.userId)) {
                conversationsMap.set(msg.userId, {
                    userId: msg.userId,
                    lastMessage: msg.body,
                    timestamp: msg.timestamp,
                });
            }
        }

        return Array.from(conversationsMap.values());
    },
});

export const markRead = mutation({
    args: { messageIds: v.array(v.id("messages")) },
    handler: async (ctx, args) => {
        for (const id of args.messageIds) {
            await ctx.db.patch(id, { read: true });
        }
    },
});

export const markAllRead = mutation({
    args: { userId: v.string(), role: v.string() }, // role: "admin" or "user" (who is reading)
    handler: async (ctx, args) => {
        const messages = await ctx.db
            .query("messages")
            .withIndex("byUserId", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("read"), false))
            .collect();

        for (const msg of messages) {
            // If Admin is reading, mark messages FROM user as read
            if (args.role === "admin" && msg.sender === "user") {
                await ctx.db.patch(msg._id, { read: true });
            }
            // If User is reading, mark messages FROM admin as read
            if (args.role === "user" && msg.sender === "admin") {
                await ctx.db.patch(msg._id, { read: true });
            }
        }
    },
});

export const archive = mutation({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        const messages = await ctx.db
            .query("messages")
            .withIndex("byUserId", (q) => q.eq("userId", args.userId))
            .filter((q) => q.neq(q.field("archived"), true))
            .collect();

        for (const msg of messages) {
            await ctx.db.patch(msg._id, { archived: true });
        }
    },
});

export const unreadCount = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        const unread = await ctx.db
            .query("messages")
            .withIndex("byUserId", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("read"), false))
            .filter((q) => q.eq(q.field("sender"), "admin"))
            .filter((q) => q.neq(q.field("archived"), true))
            .collect();
        return unread.length;
    },
});

export const adminUnreadCount = query({
    handler: async (ctx) => {
        const unread = await ctx.db
            .query("messages")
            .withIndex("byRead", (q) => q.eq("read", false))
            .filter((q) => q.eq(q.field("sender"), "user"))
            .filter((q) => q.neq(q.field("archived"), true))
            .collect();
        return unread.length;
    },
});
