import { internalMutation, mutation, query, internalQuery } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { UserJSON } from "@clerk/backend";
import { v } from "convex/values";
import type { Validator } from "convex/values";

export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    // In real app, protect this with admin check
    return await ctx.db.query("users").collect();
  }
});



// storeUser removed


export const ensureUserExists = internalMutation({
  args: {
    identity: v.any(),
  },
  async handler(ctx, { identity }) {
    const externalId = identity.subject;
    const user = await userByExternalId(ctx, externalId);

    const userAttributes = {
      name: identity.name || identity.email || 'Unknown User',
      externalId: externalId,
      email: identity.email,
    };

    if (user === null) {
      await ctx.db.insert("users", userAttributes);
    } else {
      await ctx.db.patch(user._id, userAttributes);
    }
  }
});

export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> }, // no runtime validation, trust Clerk
  async handler(ctx, { data }) {
    const userAttributes = {
      name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.email_addresses[0]?.email_address || 'Unknown User',
      externalId: data.id,
      email: data.email_addresses[0]?.email_address,
    };

    const user = await userByExternalId(ctx, data.id);
    if (user === null) {
      await ctx.db.insert("users", userAttributes);
    } else {
      await ctx.db.patch(user._id, userAttributes);
    }
  },
});

export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  async handler(ctx, { clerkUserId }) {
    const user = await userByExternalId(ctx, clerkUserId);

    if (user !== null) {
      await ctx.db.delete(user._id);
    } else {
      console.warn(
        `Can't delete user, there is none for Clerk user ID: ${clerkUserId}`,
      );
    }
  },
});



export async function getCurrentUserOrThrow(ctx: QueryCtx) {
  const userRecord = await getCurrentUser(ctx);
  if (!userRecord) throw new Error("Can't get current user");
  return userRecord;
}

export async function getCurrentUser(ctx: QueryCtx) {
  const userId = await getEffectiveUserId(ctx);
  const user = await userByExternalId(ctx, userId);

  // Auto-create guest user if missing
  if (!user && userId === "guest_user_123") {
    return {
      _id: "guest_user_id" as any,
      name: "Guest User",
      email: "guest@freightcode.dev",
      externalId: "guest_user_123",
      role: "admin"
    };
  }

  return user;
}

async function userByExternalId(ctx: QueryCtx, externalId: string) {
  return await ctx.db
    .query("users")
    .withIndex("byExternalId", (q) => q.eq("externalId", externalId))
    .unique();
}

/**
 * Guest Identity Fallback
 * Returns the Clerk ID if logged in, or a static guest ID if auth is removed.
 */
export async function getEffectiveUserId(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject || "guest_user_123";
}



export const getUserByExternalId = internalQuery({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId }) => {
    return await userByExternalId(ctx, externalId);
  },
});

// Role management - Only platform admins can change roles
export const setUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("client"), v.literal("admin"), v.literal("platform:superadmin")),
  },
  async handler(ctx, { userId, role }) {
    // Check if current user is a platform admin
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser || currentUser.role !== "platform:superadmin") {
      throw new Error("Only platform admins can change user roles");
    }

    await ctx.db.patch(userId, { role });
    return { success: true };
  },
});

// Get user by ID (for admin views)
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

// Delete a user (Admin only)
export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
      .unique();

    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'platform:superadmin')) {
      throw new Error("Only admins can delete users");
    }

    await ctx.db.delete(args.userId);
  },
});

// List users for admin (with org filtering)
export const listUsersForOrg = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const orgId = (identity as any).org_id;

    if (orgId) {
      return await ctx.db
        .query("users")
        .withIndex("byOrgId", (q) => q.eq("orgId", orgId))
        .collect();
    }

    // Platform admins can see all users
    const currentUser = await getCurrentUser(ctx);
    if (currentUser?.role === "platform:superadmin") {
      return await ctx.db.query("users").collect();
    }

    return [];
  },
});