import { action } from "./_generated/server";
import { v } from "convex/values";
import { HMRCService } from "../src/services/hmrc/HMRCService";
import { internal } from "./_generated/api";

const HMRC_CLIENT_ID = process.env.HMRC_CLIENT_ID;
const HMRC_CLIENT_SECRET = process.env.HMRC_CLIENT_SECRET;
const HMRC_REDIRECT_URI = process.env.HMRC_REDIRECT_URI || "http://localhost:5173/auth/hmrc/callback";
const HMRC_ENVIRONMENT = process.env.HMRC_ENVIRONMENT || "sandbox";
const HMRC_ACTION_TIMEOUT_MS = 8000;

async function withTimeout<T>(promise: Promise<T>, label: string, timeoutMs: number = HMRC_ACTION_TIMEOUT_MS): Promise<T> {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            promise,
            new Promise<T>((_, reject) => {
                timeout = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
            }),
        ]);
    } finally {
        if (timeout) clearTimeout(timeout);
    }
}

/**
 * Common helper to ensure a valid HMRC token exists, refreshing if necessary.
 */
async function ensureValidHMRCIntegration(ctx: any, hmrc: HMRCService, integration: any) {
    let currentToken = integration?.accessToken;

    if (integration && integration.expiresAt && Date.now() > integration.expiresAt - 60000) {
        console.log("HMRC Token expired, refreshing...");
        try {
            const tokens = await hmrc.refreshAccessToken();
            const expiresAt = Date.now() + (tokens.expiresIn * 1000);

            await ctx.runMutation(internal.integrations.saveIntegration, {
                provider: "hmrc",
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresAt,
                status: "active",
            });
            currentToken = tokens.accessToken;
        } catch (refreshError) {
            console.error("Auto-refresh failed:", refreshError);
            throw new Error("HMRC session expired. Please reconnect your account.");
        }
    }

    if (!currentToken) {
        throw new Error("HMRC account not connected. Please go to Integration settings.");
    }

    return currentToken;
}

/**
 * Generate the authorization link for the admin to connect HMRC.
 */
export const getHMRCAuthUrl = action({
    args: {
        state: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (!HMRC_CLIENT_ID || !HMRC_CLIENT_SECRET) {
            throw new Error("HMRC credentials not configured.");
        }

        const hmrc = HMRCService.create(HMRC_CLIENT_ID, HMRC_CLIENT_SECRET, HMRC_REDIRECT_URI, HMRC_ENVIRONMENT);
        return hmrc.getAuthorizationUrl(args.state || "default");
    },
});

/**
 * Exchange the code from HMRC for tokens and save them.
 */
export const exchangeAuthorizationCode = action({
    args: {
        code: v.string(),
    },
    handler: async (ctx, args) => {
        if (!HMRC_CLIENT_ID || !HMRC_CLIENT_SECRET) {
            throw new Error("HMRC credentials not configured in environment.");
        }

        const hmrc = HMRCService.create(HMRC_CLIENT_ID, HMRC_CLIENT_SECRET, HMRC_REDIRECT_URI, HMRC_ENVIRONMENT);

        try {
            const tokens = await hmrc.getAuthorizationCodeToken(args.code);
            const expiresAt = Date.now() + (tokens.expiresIn * 1000);

            // Save to Integrations table (Centralized/Platform level if orgId is null)
            await ctx.runMutation(internal.integrations.saveIntegration, {
                provider: "hmrc",
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresAt,
                status: "active",
            });

            console.log("Successfully exchanged and saved HMRC tokens");

            return {
                success: true,
                message: "HMRC account connected successfully",
                expiresAt
            };
        } catch (error: any) {
            console.error("HMRC Token Exchange Error:", error);
            throw new Error(error.message);
        }
    },
});

/**
 * Check Duty Deferment Account Balance.
 * Uses the saved OAuth token for authentication.
 */
export const getDutyDeferment = action({
    args: {
        eori: v.string(),
    },
    handler: async (ctx, args) => {
        if (!HMRC_CLIENT_ID || !HMRC_CLIENT_SECRET) {
            throw new Error("HMRC credentials not configured.");
        }

        // 1. Look up the saved integration
        const integration = await ctx.runQuery(internal.integrations.getIntegration, { provider: "hmrc" });

        const hmrc = HMRCService.create(
            HMRC_CLIENT_ID,
            HMRC_CLIENT_SECRET,
            HMRC_REDIRECT_URI,
            HMRC_ENVIRONMENT,
            integration?.accessToken,
            integration?.refreshToken
        );

        try {
            await ensureValidHMRCIntegration(ctx, hmrc, integration);
            return await withTimeout(hmrc.getDutyDefermentBalance(args.eori), "HMRC duty deferment");
        } catch (error: any) {
            console.error("HMRC DDA Action Error:", {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });

            if (error.response?.status === 401) {
                throw new Error("HMRC authentication failed. Please reconnect your account.");
            }

            throw new Error(`DDA Lookup Failed: ${error.message}`);
        }
    },
});

// -- Other public data APIs (Client Credentials Flow) --

export const searchHSCode = action({
    args: {
        query: v.string(),
    },
    handler: async (ctx, args) => {
        if (!HMRC_CLIENT_ID || !HMRC_CLIENT_SECRET) {
            return [];
        }

        const hmrc = HMRCService.create(HMRC_CLIENT_ID, HMRC_CLIENT_SECRET, HMRC_REDIRECT_URI, HMRC_ENVIRONMENT);

        try {
            return await withTimeout(hmrc.searchCommodities(args.query), "HMRC HS search");
        } catch (error: any) {
            console.warn("HMRC Search (Public):", error.message);
            return [];
        }
    },
});

export const validateHSCode = action({
    args: {
        code: v.string(),
        countryCode: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (!HMRC_CLIENT_ID || !HMRC_CLIENT_SECRET) {
            throw new Error("HMRC credentials not configured.");
        }

        const hmrc = HMRCService.create(HMRC_CLIENT_ID, HMRC_CLIENT_SECRET, HMRC_REDIRECT_URI, HMRC_ENVIRONMENT);

        try {
            const validation = await withTimeout(hmrc.validateCommodityCode(args.code), "HMRC HS validation");

            if (validation.valid) {
                const measures = await withTimeout(hmrc.getMeasures(args.code, args.countryCode), "HMRC measures lookup");
                return {
                    ...validation,
                    measures
                };
            }

            return validation;
        } catch (error: any) {
            console.error("HMRC Action Error:", error);
            throw new Error(error.message);
        }
    },
});

export const validateEORI = action({
    args: {
        eori: v.string(),
    },
    handler: async (ctx, args) => {
        if (!HMRC_CLIENT_ID || !HMRC_CLIENT_SECRET) {
            throw new Error("HMRC credentials not configured.");
        }

        const hmrc = HMRCService.create(HMRC_CLIENT_ID, HMRC_CLIENT_SECRET, HMRC_REDIRECT_URI, HMRC_ENVIRONMENT);

        try {
            return await withTimeout(hmrc.validateEORI(args.eori), "HMRC EORI validation");
        } catch (error: any) {
            console.error("HMRC EORI Error:", error);
            throw new Error(error.message);
        }
    },
});

export const getENSStatus = action({
    args: {
        mrn: v.string(),
    },
    handler: async (ctx, args) => {
        if (!HMRC_CLIENT_ID || !HMRC_CLIENT_SECRET) {
            throw new Error("HMRC credentials not configured.");
        }

        // 1. Look up the saved integration to get the User Token
        const integration = await ctx.runQuery(internal.integrations.getIntegration, { provider: "hmrc" });

        const hmrc = HMRCService.create(
            HMRC_CLIENT_ID,
            HMRC_CLIENT_SECRET,
            HMRC_REDIRECT_URI,
            HMRC_ENVIRONMENT,
            integration?.accessToken,
            integration?.refreshToken
        );

        try {
            await ensureValidHMRCIntegration(ctx, hmrc, integration);
            return await withTimeout(hmrc.checkENSStatus(args.mrn), "HMRC ENS status");
        } catch (error: any) {
            console.error("HMRC ENS Error Details:", {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });

            // If we still get a 401, the token might be revoked or invalid
            if (error.response?.status === 401) {
                throw new Error("HMRC authentication failed. Please reconnect your account.");
            }

            throw new Error(`HMRC ENS Check Failed: ${error.message}`);
        }
    },
});
