
const COMTRADE_KEY = '4fe05c49cd204dffb971aba2d1db96cf'; // In production, move to import.meta.env.VITE_COMTRADE_KEY
const BASE_URL = 'https://comtradeapi.un.org/public/v1';

export interface TariffLine {
    typeCode: string;
    freqCode: string;
    reporterCode: number;
    reporterDesc: string;
    flowCode: string;
    flowDesc: string;
    partnerCode: number;
    partnerDesc: string;
    cmdCode: string;
    cmdDesc: string;
    primaryValue: number;
    netWgt: number;
    isLeaf: boolean;
}

export const comtradeService = {
    /**
     * Get Tariff Line Data (HS Codes)
     * Note: Public API has strict limits. We might need to mock if rate limited.
     */
    getTariffLine: async (params: {
        reporter?: string; // e.g. '826' for UK, '842' for USA
        partner?: string;  // e.g. '0' for World
        period?: string;   // e.g. '2023'
        cmdCode?: string;  // HS Code, e.g. '91' or '9101'
    }) => {
        try {
            const query = new URLSearchParams({
                reporterCode: params.reporter || '826', // Default UK
                partnerCode: params.partner || '0',     // Default World
                period: params.period || '2023',
                cmdCode: params.cmdCode || 'TOTAL',
                flowCode: 'M', // Import
                frequency: 'A', // Annual
                format: 'JSON',
            });

            const response = await fetch(`${BASE_URL}/getDATariffline?${query.toString()}`, {
                method: 'GET',
                headers: {
                    'Ocp-Apim-Subscription-Key': COMTRADE_KEY,
                },
            });

            if (!response.ok) {
                throw new Error(`Comtrade API Error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error("Comtrade API Failed:", error);
            return [];
        }
    },

    /**
     * Search for HS Codes by text (Simulation/Mock for now as Comtrade Search is complex)
     * Real implementation would use their metadata endpoint or a dedicated search index.
     */
    searchHSCodes: async (searchTerm: string) => {
        // For demo purposes, we'll return some common HS codes if the API is too complex/slow
        // In a real app, we would query the `getClist` or metadata endpoints.

        // Simulating delay
        await new Promise(r => setTimeout(r, 500));

        const MOCK_DB = [
            { code: '0901', desc: 'Coffee, whether or not roasted or decaffeinated' },
            { code: '8471', desc: 'Automatic data processing machines (computers)' },
            { code: '8517', desc: 'Telephone sets, including smartphones' },
            { code: '8703', desc: 'Motor cars and other motor vehicles' },
            { code: '6109', desc: 'T-shirts, singlets and other vests, knitted or crocheted' },
            { code: '9403', desc: 'Other furniture and parts thereof' },
            { code: '9503', desc: 'Tricycles, scooters, pedal cars and similar wheeled toys' },
        ];

        return MOCK_DB.filter(item =>
            item.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.code.includes(searchTerm)
        );
    }
};
