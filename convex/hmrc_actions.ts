import { action } from "./_generated/server";
import { v } from "convex/values";
import { HMRCService } from "../src/services/hmrc/HMRCService";

const HMRC_CLIENT_ID = process.env.HMRC_CLIENT_ID;
const HMRC_CLIENT_SECRET = process.env.HMRC_CLIENT_SECRET;
const HMRC_REDIRECT_URI = process.env.HMRC_REDIRECT_URI || "https://freightcode-dev.vercel.app/";
const HMRC_ENVIRONMENT = process.env.HMRC_ENVIRONMENT || "sandbox";

export const searchHSCode = action({
    args: {
        query: v.string(),
    },
    handler: async (ctx, args) => {
        if (!HMRC_CLIENT_ID || !HMRC_CLIENT_SECRET) {
            console.log("HMRC credentials not configured, returning empty search");
            return [];
        }

        const hmrc = HMRCService.create(HMRC_CLIENT_ID, HMRC_CLIENT_SECRET, HMRC_REDIRECT_URI, HMRC_ENVIRONMENT);

        try {
            return await hmrc.searchCommodities(args.query);
        } catch (error: any) {
            console.error("HMRC Search Action Error:", error);
            throw new Error(error.message);
        }
    },
});

export const validateHSCode = action({
    args: {
        code: v.string(),
        countryCode: v.optional(v.string()), // e.g. "CN"
    },
    handler: async (ctx, args) => {
        if (!HMRC_CLIENT_ID || !HMRC_CLIENT_SECRET) {
            console.log("HMRC credentials not configured, returning mock validation");
            return {
                valid: true,
                description: "MOCK: Validated HS Code via HMRC Sandbox",
                declarable: true,
                measures: [
                    { dutyRate: "6.50 %", measureType: "Third country duty" },
                    { dutyRate: "20.00 %", measureType: "Value added tax" }
                ]
            };
        }

        const hmrc = HMRCService.create(HMRC_CLIENT_ID, HMRC_CLIENT_SECRET, HMRC_REDIRECT_URI, HMRC_ENVIRONMENT);

        try {
            const validation = await hmrc.validateCommodityCode(args.code);

            if (validation.valid) {
                const measures = await hmrc.getMeasures(args.code, args.countryCode);
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
            return {
                valid: true,
                companyName: "MOCK: Global Logistics Ltd",
                address: "10 Downing Street, London",
                eori: args.eori
            };
        }

        const hmrc = HMRCService.create(HMRC_CLIENT_ID, HMRC_CLIENT_SECRET, HMRC_REDIRECT_URI, HMRC_ENVIRONMENT);

        try {
            return await hmrc.validateEORI(args.eori);
        } catch (error: any) {
            console.error("HMRC EORI Action Error:", error);
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
            return {
                success: true,
                status: "ACCEPTED",
                receivedDateTime: new Date().toISOString(),
                mrn: args.mrn
            };
        }

        const hmrc = HMRCService.create(HMRC_CLIENT_ID, HMRC_CLIENT_SECRET, HMRC_REDIRECT_URI, HMRC_ENVIRONMENT);

        try {
            return await hmrc.checkENSStatus(args.mrn);
        } catch (error: any) {
            console.error("HMRC ENS Action Error:", error);
            throw new Error(error.message);
        }
    },
});

export const getDutyDeferment = action({
    args: {
        eori: v.string(),
    },
    handler: async (ctx, args) => {
        if (!HMRC_CLIENT_ID || !HMRC_CLIENT_SECRET) {
            return {
                success: true,
                accountNumber: "MOCK-DDA-9988",
                creditLimit: 25000,
                availableCredit: 4500.00,
                currency: "GBP",
                status: "ACTIVE"
            };
        }

        const hmrc = HMRCService.create(HMRC_CLIENT_ID, HMRC_CLIENT_SECRET, HMRC_REDIRECT_URI, HMRC_ENVIRONMENT);

        try {
            return await hmrc.getDutyDefermentBalance(args.eori);
        } catch (error: any) {
            console.error("HMRC DDA Action Error:", error);
            throw new Error(error.message);
        }
    },
});
