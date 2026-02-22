import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import Stripe from "stripe";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/backend";
import { transformWebhookData } from "./paymentAttemptTypes";
import { clerk } from "./clerk";

const http = httpRouter();

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set!");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20" as any,
  });
};

http.route({
  path: "/stripe-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing signature", { status: 400 });
    }

    let event: Stripe.Event;
    try {
      const stripe = getStripe();
      const payload = await request.text();
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response("Webhook signature verification failed", { status: 400 });
    }

    const { type, data } = event;
    const object = data.object as any;

    switch (type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const status = object.status;
        const planId = object.items?.data?.[0]?.price?.id;
        const tier = object.metadata?.plan || (planId ? "pro" : "free");

        const result = await ctx.runMutation(internal.paymentsData.handleSubscriptionChange, {
          stripeCustomerId: object.customer as string,
          userId: object.metadata?.userId,
          status: status,
          plan: tier,
          tier: tier
        });

        // Sync Clerk Metadata (Node.js Action Logic)
        if (result && result.userId) {
          try {
            if (result.orgId) {
              await clerk.organizations.updateOrganizationMetadata(result.orgId, {
                publicMetadata: {
                  subscriptionTier: tier,
                  subscriptionStatus: status,
                  planUpdatedAt: Date.now(),
                },
              });
            } else {
              await clerk.users.updateUserMetadata(result.userId, {
                publicMetadata: {
                  subscriptionTier: tier,
                  subscriptionStatus: status,
                  planUpdatedAt: Date.now(),
                },
              });
            }
          } catch (err) {
            console.error("Failed to sync Clerk metadata from webhook:", err);
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        // Handle payment success logic if needed
        break;
      }
    }

    return new Response(null, { status: 200 });
  }),
});

http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const event = await validateRequest(request);
    if (!event) {
      return new Response("Error occured", { status: 400 });
    }
    switch ((event as any).type) {
      case "user.created": // intentional fallthrough
      case "user.updated":
        await ctx.runMutation(internal.users.upsertFromClerk, {
          data: event.data as any,
        });
        break;

      case "user.deleted": {
        const clerkUserId = (event.data as any).id!;
        await ctx.runMutation(internal.users.deleteFromClerk, { clerkUserId });
        break;
      }

      case "paymentAttempt.updated": {
        const paymentAttemptData = transformWebhookData((event as any).data);
        await ctx.runMutation(internal.paymentAttempts.savePaymentAttempt, {
          paymentAttemptData,
        });
        break;
      }

      case "organization.created":
      case "organization.updated":
        await ctx.runMutation(internal.organizations.upsertFromClerk, {
          data: event.data as any,
        });
        break;

      case "organization.deleted": {
        const clerkOrgId = (event.data as any).id!;
        await ctx.runMutation(internal.organizations.deleteFromClerk, { clerkOrgId });
        break;
      }

      case "organizationMembership.created":
      case "organizationMembership.updated": {
        const memberData = event.data as any;
        await ctx.runMutation(internal.organizations.updateUserOrgMembership, {
          clerkUserId: memberData.public_user_data?.user_id,
          clerkOrgId: memberData.organization?.id,
          role: memberData.role,
        });
        break;
      }

      case "organizationMembership.deleted": {
        const memberData = event.data as any;
        await ctx.runMutation(internal.organizations.updateUserOrgMembership, {
          clerkUserId: memberData.public_user_data?.user_id,
          clerkOrgId: undefined,
          role: undefined,
        });
        break;
      }

      default:
        console.log("Ignored webhook event", (event as any).type);
    }

    return new Response(null, { status: 200 });
  }),
});

async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const payloadString = await req.text();
  const svixHeaders = {
    "svix-id": req.headers.get("svix-id")!,
    "svix-timestamp": req.headers.get("svix-timestamp")!,
    "svix-signature": req.headers.get("svix-signature")!,
  };
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  try {
    return wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
  } catch (error) {
    console.error("Error verifying webhook event", error);
    return null;
  }
}

export default http;