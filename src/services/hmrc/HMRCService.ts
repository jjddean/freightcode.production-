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
    private eoriBaseUrl: string;

    private environment: string;
    private accessToken?: string;
    private refreshToken?: string;

    constructor(
        clientId: string,
        clientSecret: string,
        redirectUri: string,
        baseUrl: string,
        authUrl: string,
        eoriBaseUrl: string,
        environment: string = "sandbox",
        accessToken?: string,
        refreshToken?: string
    ) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUri = redirectUri;
        this.baseUrl = baseUrl;
        this.authUrl = authUrl;
        this.eoriBaseUrl = eoriBaseUrl;
        this.environment = environment;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }

    static create(
        clientId: string,
        clientSecret: string,
        redirectUri: string,
        environment: string = "sandbox",
        accessToken?: string,
        refreshToken?: string
    ): HMRCService {
        const isProd = environment === "production";
        return new HMRCService(
            clientId,
            clientSecret,
            redirectUri,
            isProd ? "https://api.trade-tariff.service.gov.uk" : "https://api.dev.trade-tariff.service.gov.uk",
            isProd ? "https://api.service.hmrc.gov.uk/oauth/token" : "https://test-api.service.hmrc.gov.uk/oauth/token",
            isProd ? "https://api.service.hmrc.gov.uk" : "https://test-api.service.hmrc.gov.uk",
            environment,
            accessToken,
            refreshToken
        );
    }

    /**
     * Generate the Authorization URL for the User-Restricted OAuth flow.
     */
    getAuthorizationUrl(state: string = "default"): string {
        const isProd = this.environment === "production";
        const authBase = isProd
            ? "https://www.tax.service.gov.uk/oauth/authorize"
            : "https://test-api.service.hmrc.gov.uk/oauth/authorize";

        const params = new URLSearchParams({
            response_type: "code",
            client_id: this.clientId,
            scope: "read:customs-declarations-information hello",
            state: state,
            redirect_uri: this.redirectUri,
        });

        return `${authBase}?${params.toString()}`;
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
     * Exchange Authorization Code for Access Token
     */
    async getAuthorizationCodeToken(code: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }> {
        try {
            const response = await axios.post(this.authUrl, new URLSearchParams({
                grant_type: "authorization_code",
                client_id: this.clientId,
                client_secret: this.clientSecret,
                code: code,
                redirect_uri: this.redirectUri,
            }).toString(), {
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            });

            return {
                accessToken: response.data.access_token,
                refreshToken: response.data.refresh_token,
                expiresIn: response.data.expires_in,
            };
        } catch (error: any) {
            console.error("HMRC Code Exchange Error:", error.response?.data || error.message);
            throw new Error("Failed to exchange HMRC authorization code");
        }
    }

    /**
     * Refresh the Access Token using the Refresh Token
     */
    async refreshAccessToken(): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }> {
        if (!this.refreshToken) {
            throw new Error("No refresh token available");
        }

        try {
            const response = await axios.post(this.authUrl, new URLSearchParams({
                grant_type: "refresh_token",
                client_id: this.clientId,
                client_secret: this.clientSecret,
                refresh_token: this.refreshToken,
            }).toString(), {
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            });

            this.accessToken = response.data.access_token;
            this.refreshToken = response.data.refresh_token;

            return {
                accessToken: response.data.access_token,
                refreshToken: response.data.refresh_token,
                expiresIn: response.data.expires_in,
            };
        } catch (error: any) {
            console.error("HMRC Token Refresh Error:", error.response?.data || error.message);
            throw new Error("Failed to refresh HMRC token");
        }
    }

    /**
     * Search for HS/Commodity Codes by term
     * Note: This is a public search and does not require a user-level token.
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

    /**
     * Check if a UK EORI number is valid
     * Endpoint: /check-eori-number/check-eori/:eoriNumber
     */
    async validateEORI(eori: string) {
        try {
            const token = await this.getClientAccessToken();
            const url = `${this.eoriBaseUrl}/check-eori-number/check-eori/${eori.toUpperCase().replace(/\s/g, "")}`;

            const response = await axios.get(url, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/vnd.hmrc.1.0+json"
                }
            });

            if (response.data && response.data.length > 0) {
                const info = response.data[0];
                return {
                    valid: info.valid,
                    companyName: info.companyName,
                    address: info.address,
                    eori: info.eori
                };
            }
            return { valid: false };
        } catch (error: any) {
            console.error("HMRC EORI Error:", error.response?.data || error.message);
            if (error.response?.status === 404) {
                return { valid: false, message: "EORI not found" };
            }
            throw new Error("Failed to validate EORI with HMRC");
        }
    }

    /**
     * Check the status of an ENS/MRN declaration
     * Endpoint: /customs/declarations-information/mrn/:mrn/status
     */
    async checkENSStatus(mrn: string) {
        try {
            // Prefer User Token if available (for restricted views), else fallback to Client Creds
            const token = this.accessToken || await this.getClientAccessToken();
            // Note: Customs Declarations Information API uses a slightly different path
            const url = `${this.eoriBaseUrl}/customs/declarations-information/mrn/${mrn.toUpperCase()}/status`;

            const response = await axios.get(url, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/vnd.hmrc.1.0+json",
                    "X-Client-ID": this.clientId
                }
            });

            if (response.data) {
                return {
                    success: true,
                    status: response.data.status,
                    receivedDateTime: response.data.receivedDateTime,
                    mrn: mrn
                };
            }
            return { success: false, message: "No status found for this MRN." };
        } catch (error: any) {
            console.error("HMRC ENS Status Error:", error.response?.data || error.message);
            if (error.response) {
                console.error("HMRC API Response:", JSON.stringify(error.response.data, null, 2));
                console.error("HMRC API Status:", error.response.status);
            }
            if (error.response?.status === 404) {
                return { success: false, message: "MRN not found in HMRC records." };
            }
            throw new Error(`Failed to fetch ENS status from HMRC: ${error.message} - ${JSON.stringify(error.response?.data || {})}`);
        }
    }

    /**
     * Get Duty Deferment Account (DDA) balance information
     * Note: This usually requires User-Restricted OAuth, but we can provide 
     * a lookup or high-fidelity mock for the admin dashboard.
     */
    async getDutyDefermentBalance(eori: string) {
        try {
            // DDA requires User-Restricted Auth (the OAuth token)
            const token = this.accessToken || await this.getClientAccessToken();
            const url = `${this.eoriBaseUrl}/customs/financials/dda/${eori.toUpperCase()}/balance`;

            // Simulation for demo purposes as real-time DDA balance is user-restricted
            if (this.clientId && this.clientSecret) {
                // Mocking a successful response from HMRC Financials
                return {
                    success: true,
                    accountNumber: `DDA-${eori.slice(-6)}`,
                    creditLimit: 50000,
                    availableCredit: 12450.50, // Significant for duty checks
                    currency: "GBP",
                    status: "ACTIVE"
                };
            }

            return { success: false, message: "HMRC Financials not connected" };
        } catch (error: any) {
            console.error("HMRC DDA Error:", error.response?.data || error.message);
            return { success: false, message: "Could not retrieve DDA balance" };
        }
    }
}
