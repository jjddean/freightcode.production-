import axios from "axios";

/**
 * HMRC SERVICE
 * Handles OAuth2 authentication and interactions with the UK Trade Tariff & CDS APIs.
 */
export class HMRCService {
    private clientId: string;
    private clientSecret: string;
    private redirectUri: string;
    private baseUrl: string;
    private authUrl: string;

    constructor(
        clientId: string,
        clientSecret: string,
        redirectUri: string,
        baseUrl: string,
        authUrl: string
    ) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUri = redirectUri;
        this.baseUrl = baseUrl;
        this.authUrl = authUrl;
    }

    static create(clientId: string, clientSecret: string, redirectUri: string, environment: string = "sandbox"): HMRCService {
        const isProd = environment === "production";
        return new HMRCService(
            clientId,
            clientSecret,
            redirectUri,
            isProd ? "https://api.trade-tariff.service.gov.uk" : "https://api.dev.trade-tariff.service.gov.uk",
            isProd ? "https://api.service.hmrc.gov.uk/oauth/token" : "https://test-api.service.hmrc.gov.uk/oauth/token"
        );
    }

    /**
     * Get Access Token via Client Credentials Flow (Application-level access)
     */
    async getClientAccessToken(): Promise<string> {
        try {
            const response = await axios.post(this.authUrl, new URLSearchParams({
                grant_type: "client_credentials",
                client_id: this.clientId,
                client_secret: this.clientSecret,
            }).toString(), {
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            });

            return response.data.access_token;
        } catch (error: any) {
            console.error("HMRC Auth Error:", error.response?.data || error.message);
            throw new Error("Failed to authenticate with HMRC");
        }
    }

    /**
     * Search for HS/Commodity Codes by term
     */
    async searchCommodities(query: string) {
        try {
            // The search endpoint v2 provides suggestions and exact matches
            const url = `${this.baseUrl}/uk/api/v2/search`;
            const response = await axios.get(url, {
                params: { q: query }
            });

            if (response.data && response.data.data) {
                const results = response.data.data.attributes.results || [];
                return results.map((r: any) => ({
                    code: r.goods_nomenclature_item_id,
                    description: r.description,
                    matchType: r.match_type
                }));
            }
            return [];
        } catch (error: any) {
            console.error("HMRC Search Error:", error.response?.data || error.message);
            return [];
        }
    }

    /**
     * Validate an HS/Commodity Code
     * Checks if the code exists and returns its description and regulatory hierarchy.
     */
    async validateCommodityCode(code: string) {
        try {
            const url = `${this.baseUrl}/uk/api/v2/commodities/${code}`;
            const response = await axios.get(url);

            if (response.data && response.data.data) {
                const attr = response.data.data.attributes;
                const included = response.data.included || [];

                // Extract Section/Chapter notes (Regulatory Insights)
                const section = included.find((i: any) => i.type === "section")?.attributes || {};
                const chapter = included.find((i: any) => i.type === "chapter")?.attributes || {};

                return {
                    valid: true,
                    description: attr.description,
                    formattedDescription: attr.formatted_description,
                    declarable: attr.declarable,
                    regulatoryInsights: {
                        section: section.title,
                        chapter: chapter.description,
                        notes: section.section_note || chapter.chapter_note
                    }
                };
            }
            return { valid: false };
        } catch (error: any) {
            if (error.response?.status === 404) {
                return { valid: false, message: "Commodity code not found" };
            }
            console.error("HMRC API Error:", error.response?.data || error.message);
            throw new Error("Failed to validate commodity code with HMRC");
        }
    }

    /**
     * Get Measures (Duties, VAT, Quotas) for a commodity code
     */
    async getMeasures(code: string, countryCode: string = "CN") {
        try {
            const url = `${this.baseUrl}/uk/api/v2/commodities/${code}`;
            const response = await axios.get(url, {
                params: { "filter[geographical_area_id]": countryCode }
            });

            const included = response.data.included || [];
            const measures = included.filter((item: any) => item.type === "measure");

            return measures.map((m: any) => ({
                id: m.id,
                dutyRate: m.attributes.duty_expression?.base,
                measureType: m.attributes.measure_type?.description,
                legalActs: m.attributes.legal_acts?.map((a: any) => a.title)
            }));
        } catch (error: any) {
            console.error("HMRC Measures Error:", error.response?.data || error.message);
            return [];
        }
    }
}
